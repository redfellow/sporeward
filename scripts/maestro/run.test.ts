// @harvaaja-test-tier: fast
import {describe,it,expect} from 'vitest';
import {parseArgs,preconditionProblems,maestroCandidates,chooseAvd,orderFlows,screenshotNames,missingScreenshots,reportScreenshot,type Probe} from './run.mts';

const ready:Probe={maestro:true,emulator:true,adb:true,deviceRunning:false,avds:['Pixel_API36']};

describe('Maestro runner preconditions',()=>{
	it.each<[string,Partial<Probe>,string|null,RegExp[]]>([
		['all tools present',{},null,[]],
		['maestro missing',{maestro:false},null,[/get\.maestro\.mobile\.dev/]],
		['adb missing',{adb:false},null,[/Platform-Tools/]],
		['emulator missing and nothing running',{emulator:false},null,[/Android Emulator/]],
		['no AVD and nothing running',{avds:[]},null,[/Android Virtual Device/]],
		['requested AVD absent',{},'Other',[/AVD Other not found/]],
		['running device needs no emulator or AVD',{emulator:false,avds:[],deviceRunning:true},null,[]],
		['several tools missing',{maestro:false,adb:false},null,[/maestro/i,/adb/]],
	])('%s',(_name,probe,avd,expected)=>{
		const problems=preconditionProblems({...ready,...probe},avd);
		expect(problems).toHaveLength(expected.length);
		expected.forEach((pattern,i)=>expect(problems[i]).toMatch(pattern));
	});
});

describe('Maestro CLI lookup',()=>{
	it.each<[string,NodeJS.ProcessEnv,string[]]>([
		['PATH first, then the installer default',{},['maestro','/home/u/.maestro/bin/maestro']],
		['MAESTRO_BIN before both',{MAESTRO_BIN:'/opt/maestro'},['/opt/maestro','maestro','/home/u/.maestro/bin/maestro']],
		['MAESTRO_BIN equal to the default is tried once',{MAESTRO_BIN:'/home/u/.maestro/bin/maestro'},['/home/u/.maestro/bin/maestro','maestro']],
	])('%s',(_name,env,expected)=>expect(maestroCandidates(env,'/home/u')).toEqual(expected));
});

describe('Maestro runner arguments and flows',()=>{
	it.each<[string[],object|RegExp]>([
		[[],{serial:'emulator-5554',metroPort:8081,apiPort:3102,output:'artifacts/maestro',avd:null}],
		[['--metro-port=8082','--avd=Fold','--output=out'],{metroPort:8082,avd:'Fold',output:'out'}],
		[['--metro-port=0'],/Invalid port/],
		[['--metro-port=abc'],/Invalid port/],
		[['--avd='],/empty option/],
		[['--device=emulator-5556'],/Unknown option/],
		[['--upload'],/Unknown or empty option/],
	])('parses %j',(argv,expected)=>{
		if(expected instanceof RegExp)expect(()=>parseArgs(argv)).toThrow(expected);
		else expect(parseArgs(argv)).toMatchObject(expected);
	});

	it('picks the requested AVD, else the first one found',()=>{
		expect(chooseAvd(['A','B'],null)).toBe('A');
		expect(chooseAvd(['A','B'],'B')).toBe('B');
		expect(chooseAvd([],null)).toBeNull();
	});

	it('orders flows so the replay recap runs last and refuses a missing flow',()=>{
		expect(orderFlows(['/f/replay-recap.yaml','/f/field-guide.yaml','/f/launch-map.yaml'])).toEqual(['/f/launch-map.yaml','/f/field-guide.yaml','/f/replay-recap.yaml']);
		expect(()=>orderFlows(['/f/launch-map.yaml'])).toThrow(/field-guide/);
	});

	it('never accepts a run whose screenshots are missing',()=>{
		const names=screenshotNames('appId: x\n---\n- takeScreenshot: map\n- tapOn: "?"\n-   takeScreenshot: "guide-open"\n');
		expect(names).toEqual(['map','guide-open']);
		expect(missingScreenshots(names,['map.png','reports'])).toEqual(['guide-open']);
		expect(missingScreenshots(names,['map.png','guide-open.png'])).toEqual([]);
	});

	it('finds the newest copy of a screenshot inside Maestro test reports',()=>{
		const files=['2026-01-01_120000/Map/takeScreenshot/map.png','2026-01-01_130000/Map/takeScreenshot/map.png','2026-01-01_130000/Guide/takeScreenshot/guide-open.png'];
		expect(reportScreenshot('map',files)).toBe('2026-01-01_130000/Map/takeScreenshot/map.png');
		expect(reportScreenshot('guide-closed',files)).toBeNull();
	});
});
