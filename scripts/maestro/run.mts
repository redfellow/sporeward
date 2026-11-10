import {spawn,execFile,type ChildProcess} from 'node:child_process';
import {promisify} from 'node:util';
import {existsSync,openSync} from 'node:fs';
import {copyFile,mkdir,readFile,readdir,rename,rm} from 'node:fs/promises';
import {join,resolve,basename,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseReplayTrack} from '../../packages/protocol/src/replay.ts';
import {nativeReplayPlan} from '../../apps/server/src/replay/native-plan.ts';
import {APP_ID,androidSdk,defaultAdbPath,emulatorControl,wait} from '../replay/emulator-control.mts';

/** The runner drives emulator-5554 and installs the dev client on whichever AVD runs there. */
/** Flows run in this order; the runner drives the synthetic replay before `replay-recap`. */
export const FLOW_ORDER=['launch-map','field-guide','replay-recap'];
export const REPLAY_FLOW='replay-recap';
/** `npm run replay:server` always listens on 127.0.0.1:3102. */
export type RunOptions={serial:string;metroPort:number;apiPort:number;output:string;avd:string|null};
export type Probe={maestro:boolean;emulator:boolean;adb:boolean;deviceRunning:boolean;avds:string[]};

export function parseArgs(argv:string[]):RunOptions{
	const options:RunOptions={serial:'emulator-5554',metroPort:8081,apiPort:3102,output:'artifacts/maestro',avd:null};
	for(const arg of argv){
		const [name,value]=arg.split(/=(.*)/s);
		if(value===undefined||value==='')throw new Error('Unknown or empty option: '+arg);
		if(name==='--metro-port'){const port=Number(value);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port: '+arg);options.metroPort=port;}
		else if(name==='--output')options.output=value;
		else if(name==='--avd')options.avd=value;
		else throw new Error('Unknown option: '+arg);
	}
	return options;
}

/** Install hints for every missing host tool; an empty list means the run can start. */
export function preconditionProblems(probe:Probe,avd:string|null):string[]{
	const problems:string[]=[];
	if(!probe.maestro)problems.push('Maestro CLI not found. Install it with `curl -Ls https://get.maestro.mobile.dev | bash` and make sure `maestro --version` works.');
	if(!probe.adb)problems.push('adb not found. Install Android SDK Platform-Tools, or set ANDROID_HOME or ADB_PATH.');
	if(!probe.deviceRunning){
		if(!probe.emulator)problems.push('Android emulator binary not found under $ANDROID_HOME/emulator. Install the Android Emulator from the SDK Manager.');
		else if(!probe.avds.length)problems.push('No Android Virtual Device found. Create one in Android Studio Device Manager.');
		else if(avd&&!probe.avds.includes(avd))problems.push('AVD '+avd+' not found. Available: '+probe.avds.join(', ')+'.');
	}
	return problems;
}

export const chooseAvd=(avds:string[],preferred:string|null)=>preferred??avds[0]??null;
export const orderFlows=(files:string[])=>FLOW_ORDER.map(name=>{const file=files.find(f=>basename(f)===name+'.yaml');if(!file)throw new Error('Missing Maestro flow: '+name+'.yaml');return file;});
export const screenshotNames=(flow:string)=>[...flow.matchAll(/^\s*-\s*takeScreenshot:\s*["']?([\w.-]+?)["']?\s*$/gm)].map(m=>m[1]);
export const missingScreenshots=(expected:string[],files:string[])=>expected.filter(name=>!files.includes(name+'.png'));
/** Maestro 2.x saves screenshots under reports/<timestamp>/<flow>/takeScreenshot/; pick the newest report copy. */
export const reportScreenshot=(name:string,reportFiles:string[])=>reportFiles.filter(f=>basename(f)===name+'.png').sort().at(-1)??null;

const exec=promisify(execFile);
const root=fileURLToPath(new URL('../../',import.meta.url));
async function runs(file:string,args:string[]){try{await exec(file,args,{timeout:60000});return true;}catch{return false;}}
async function reachable(url:string){try{await fetch(url,{signal:AbortSignal.timeout(2000)});return true;}catch{return false;}}
async function until(what:string,timeoutMs:number,check:()=>Promise<boolean>){const deadline=Date.now()+timeoutMs;while(Date.now()<deadline){if(await check())return;await wait(1000);}throw new Error('Timed out waiting for '+what+'.');}
function run(file:string,args:string[],options:{cwd?:string;env?:NodeJS.ProcessEnv}={}){
	return new Promise<void>((done,fail)=>{const child=spawn(file,args,{cwd:options.cwd??root,env:options.env??process.env,stdio:'inherit'});child.on('error',fail);child.on('close',code=>code===0?done():fail(new Error(file+' '+args.join(' ')+' exited with '+code)));});
}
function background(file:string,args:string[],log:string,options:{cwd?:string;env?:NodeJS.ProcessEnv}={}){
	const out=openSync(log,'a');
	return spawn(file,args,{cwd:options.cwd??root,env:options.env??process.env,stdio:['ignore',out,out],detached:true});
}
function stop(child:ChildProcess){if(child.pid&&child.exitCode===null){try{process.kill(-child.pid,'SIGTERM');}catch{}}}

async function replaySyntheticOuting(control:ReturnType<typeof emulatorControl>){
	const track=parseReplayTrack(JSON.parse(await readFile(join(root,'tests/maestro/replay-track.json'),'utf8'))),plan=nativeReplayPlan(track);
	const before=await control.command('status');
	// A failed earlier run can leave its outing open, which blocks reset-world. Finish it with the session that started it.
	if(before.activity&&before.activity.status!=='finished'){
		if(!before.control?.session||before.control.activity!==before.activity.id)throw new Error('The emulator app has an unfinished outing the runner did not start. Finish it in the app, then rerun.');
		await emulatorControl({serial:control.serial,adbPath:control.adbPath,session:before.control.session}).command('finish',before.activity.id);
	}
	await control.command('reset-world');
	await control.command('check-clock');
	await control.fix(plan.first.longitude,plan.first.latitude);await wait(1000);
	await control.command('prepare');
	const activity=(await control.command('start')).activity.id as string;
	try{
		if(plan.initiallyPaused)await control.command('pause',activity);
		const baseline=performance.now();
		for(const event of plan.events){
			const delay=event.at-(performance.now()-baseline);if(delay>0)await wait(delay);
			if(event.action==='fix')await control.fix(event.fix!.longitude,event.fix!.latitude);else await control.command(event.action,activity);
		}
	}finally{await control.command('finish',activity);}
}

async function main(){
	const options=parseArgs(process.argv.slice(2)),adbPath=defaultAdbPath(),emulatorPath=join(androidSdk(),'emulator','emulator');
	const adbFound=existsSync(adbPath),emulatorFound=existsSync(emulatorPath);
	const probe=async(what:string,file:string,args:string[])=>{try{return (await exec(file,args,{timeout:60000})).stdout;}catch(e){throw new Error('Cannot take Maestro screenshots: '+what+' failed ('+file+' '+args.join(' ')+'). Check the Android SDK install.\n'+String(e instanceof Error?e.message:e).split('\n').slice(0,2).join('\n'));}};
	const devices=adbFound?await probe('listing adb devices',adbPath,['devices']):'';
	const deviceRunning=devices.split('\n').some(line=>line.startsWith(options.serial+'\tdevice'));
	const avds=!deviceRunning&&emulatorFound?(await probe('listing Android Virtual Devices',emulatorPath,['-list-avds'])).split('\n').map(s=>s.trim()).filter(Boolean):[];
	const problems=preconditionProblems({maestro:await runs('maestro',['--version']),adb:adbFound,emulator:emulatorFound,deviceRunning,avds},options.avd);
	if(problems.length)throw new Error('Cannot take Maestro screenshots:\n- '+problems.join('\n- '));

	const output=resolve(root,options.output),reports=join(output,'reports');
	// Start empty so screenshots left by an earlier run can never satisfy this one.
	await rm(reports,{recursive:true,force:true});await mkdir(output,{recursive:true});
	for(const file of await readdir(output))if(file.endsWith('.png'))await rm(join(output,file));
	const flows=orderFlows((await readdir(join(root,'tests/maestro'))).filter(f=>f.endsWith('.yaml')).map(f=>join(root,'tests/maestro',f)));
	const control=emulatorControl({serial:options.serial,metroPort:options.metroPort,adbPath});
	const children:ChildProcess[]=[];let startedEmulator=false;
	try{
		if(!deviceRunning){
			const port=options.serial.slice('emulator-'.length);
			children.push(background(emulatorPath,['-avd',chooseAvd(avds,options.avd)!,'-port',port,'-gpu','host','-no-snapshot-save','-no-boot-anim','-no-audio'],join(output,'emulator.log')));startedEmulator=true;
			await until('the emulator to boot',300000,async()=>{try{return (await control.shell(['getprop','sys.boot_completed'])).trim()==='1';}catch{return false;}});
		}
		// Keep the device crash and system logs: emulator system_server restarts otherwise surface only as hung adb calls.
		await rm(join(output,'device.log'),{force:true});
		children.push(background(adbPath,['-s',options.serial,'logcat','-b','crash','-b','system','-v','time'],join(output,'device.log')));
		const api='http://127.0.0.1:'+options.apiPort;
		if(!await reachable(api+'/replay/environment')){
			children.push(background('npm',['run','replay:server'],join(output,'api.log')));
			await until('the loopback replay API on '+options.apiPort,120000,()=>reachable(api+'/replay/environment'));
		}
		await control.adb(['reverse','tcp:'+options.apiPort,'tcp:'+options.apiPort]);
		await control.adb(['reverse','tcp:'+options.metroPort,'tcp:'+options.metroPort]);
		// Expo --localhost binds Metro to localhost, which is IPv6-only [::1] on macOS.
		const metro='http://localhost:'+options.metroPort+'/status';
		if(!await reachable(metro)){
			children.push(background('npx',['expo','start','--dev-client','--localhost','--port',String(options.metroPort)],join(output,'metro.log'),{cwd:join(root,'apps/mobile'),env:{...process.env,EXPO_PUBLIC_TEST_SERVER_URL:api,CI:'1'}}));
			await until('Metro on '+options.metroPort,180000,()=>reachable(metro));
		}
		// Expo's --device matches the AVD name, not the adb serial, so ask the emulator which AVD it is running.
		const avdName=(await control.adb(['emu','avd','name'])).split(/\r?\n/)[0].trim();
		await run('npx',['expo','run:android','--device',avdName,'--no-bundler'],{cwd:join(root,'apps/mobile')});
		// expo run:android opens the app on the Mac's LAN address, which a --localhost Metro never serves; restart it cleanly.
		await control.shell(['am','force-stop',APP_ID]);
		await control.adb(['logcat','-c']);
		await control.launchDevClient();
		await control.waitForJavascript();
		const expected:string[]=[];
		for(const flow of flows){
			if(basename(flow,'.yaml')===REPLAY_FLOW)await replaySyntheticOuting(control);
			const names=screenshotNames(await readFile(flow,'utf8'));expected.push(...names);
			await run('maestro',['--device',options.serial,'test',flow,'--test-output-dir',reports],{cwd:output});
			// Maestro may save screenshots beside the flow or inside its test-output reports instead of the working directory.
			const reportFiles=existsSync(reports)?(await readdir(reports,{recursive:true})).map(String):[];
			for(const name of missingScreenshots(names,await readdir(output))){
				const beside=join(dirname(flow),name+'.png'),inReports=reportScreenshot(name,reportFiles);
				if(existsSync(beside))await rename(beside,join(output,name+'.png'));
				else if(inReports)await copyFile(join(reports,inReports),join(output,name+'.png'));
			}
		}
		const missing=missingScreenshots(expected,await readdir(output));
		if(missing.length)throw new Error('Maestro finished without screenshots: '+missing.join(', '));
		console.log('Maestro screenshots in '+output+': '+expected.map(name=>name+'.png').join(', '));
	}finally{
		for(const child of children.slice(startedEmulator?1:0).reverse())stop(child);
		if(startedEmulator){try{await control.adb(['emu','kill']);}catch{stop(children[0]);}}
	}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exit(1);});
