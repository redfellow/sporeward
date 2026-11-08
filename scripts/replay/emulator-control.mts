import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomBytes} from 'node:crypto';

/** Shared adb, development-client and replay-bridge helpers for emulator tooling. */
export const APP_ID='com.sporeward.app';
export const androidSdk=()=>process.env.ANDROID_HOME??join(homedir(),'Library/Android/sdk');
export const defaultAdbPath=()=>process.env.ADB_PATH??join(androidSdk(),'platform-tools','adb');
export const quote=(s:string)=>"'"+s.replaceAll("'","'\\''")+"'";
export const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const exec=promisify(execFile);

export function emulatorControl({serial,metroPort=8081,adbPath=defaultAdbPath()}:{serial:string;metroPort?:number;adbPath?:string}){
	const session=randomBytes(16).toString('hex');
	const adb=async(args:string[])=>{const r=await exec(adbPath,['-s',serial,...args],{timeout:20000,maxBuffer:8*1024*1024});return r.stdout;};
	const shell=(args:string[])=>adb(['shell',args.map(quote).join(' ')]);
	async function launchDevClient(){await shell(['am','start','-a','android.intent.action.VIEW','-d','sporeward://expo-development-client/?url='+encodeURIComponent('http://localhost:'+metroPort),APP_ID]);}
	async function status(){const raw=await shell(['run-as',APP_ID,'cat','files/sporeward-replay-status.json']);const value=JSON.parse(raw);if(value.version!==1||!/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(value.server))throw new Error('Emulator needs the replay-enabled development build and isolated loopback API.');return value;}
	async function command(action:string,activity:string|null=null){
		const request=randomBytes(16).toString('hex'),url=new URL('sporeward://replay/'+action);url.searchParams.set('session',session);url.searchParams.set('request',request);if(activity)url.searchParams.set('activity',activity);
		const dispatch=()=>shell(['am','start','-a','android.intent.action.VIEW','-d',url.toString(),APP_ID]);
		await dispatch();let nextDispatch=Date.now()+10000;
		const deadline=Date.now()+60000;
		while(Date.now()<deadline){if(Date.now()>=nextDispatch){await dispatch();nextDispatch=Date.now()+10000;}try{const value=await status();if(value.control.request===request){if(value.control.error)throw new Error(value.control.error);return value;}}catch(e){if(e instanceof Error&&!(e.message.includes('ENOENT')||e.message.includes('JSON')||e.message.includes('No such file')))throw e;}await wait(150);}
		throw new Error('Native replay command timed out: '+action);
	}
	async function fix(longitude:number,latitude:number){await adb(['emu','geo','fix',String(longitude),String(latitude)]);}
	async function waitForJavascript(){
		const deadline=Date.now()+60000;
		while(Date.now()<deadline){
			const log=await adb(['logcat','-d','-t','500']);
			if(log.includes('ReactNativeJS: Running "main"'))return;
			if(log.includes('Unable to load script.')||log.includes('Maximum call stack size exceeded'))throw new Error('Android development client failed to load its JavaScript bundle.');
			await wait(250);
		}
		throw new Error('Timed out waiting for the Android JavaScript bundle.');
	}
	return {serial,adbPath,session,adb,shell,launchDevClient,status,command,fix,waitForJavascript};
}
