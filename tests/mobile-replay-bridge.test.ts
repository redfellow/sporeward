import {beforeEach,it,expect,vi} from 'vitest';
const f=vi.hoisted(()=>({files:new Map<string,string>(),fetch:vi.fn()}));
vi.mock('expo-file-system',()=>({Paths:{document:'private'},File:class {
 key:string;constructor(...parts:string[]){this.key=parts.join('/');}
 get exists(){return f.files.has(this.key);}textSync(){return f.files.get(this.key)!;}create(){}write(value:string){f.files.set(this.key,value);}delete(){f.files.delete(this.key);}
}}));
vi.mock('../apps/mobile/src/recording/recorder',()=>({}));
vi.mock('../apps/mobile/src/recording/store',()=>({current:async()=>null,recent:async()=>[]}));
vi.mock('../apps/mobile/src/server/session',()=>({savedSession:async()=>null}));
vi.mock('../apps/mobile/src/server/client',()=>({SERVER_URL:'http://127.0.0.1:3102',requestHeaders:()=>({})}));
vi.mock('../apps/mobile/src/server/credentials',()=>({loadCredentials:async()=>({username:'test',password:'disposable'})}));
vi.mock('../apps/mobile/src/server/upload',()=>({}));
beforeEach(()=>{vi.resetModules();vi.stubGlobal('__DEV__',true);vi.stubGlobal('fetch',f.fetch);f.fetch.mockReset();f.files.clear();});
it('acknowledges a repeated reset without applying it twice, including after another command',async()=>{
 f.fetch.mockImplementation(async(url:string)=>new Response(JSON.stringify(url.endsWith('/environment')?{mode:'native-replay'}:{})));
 const {applyReplayCommand}=await import('../apps/mobile/src/replay/bridge');
 const command={action:'reset-world' as const,session:'a'.repeat(32),request:'b'.repeat(32),activity:null};
 await applyReplayCommand(command);await applyReplayCommand(command);
 await applyReplayCommand({...command,action:'status',request:'c'.repeat(32)});
 await applyReplayCommand(command);
 expect(f.fetch).toHaveBeenCalledTimes(2);
 expect(JSON.parse(f.files.get('private/sporeward-replay-status.json')!).control.error).toBeNull();
});
it('acknowledges an environment rejection once without retrying its mutation',async()=>{
 f.fetch.mockResolvedValue(new Response(JSON.stringify({mode:'field'})));
 const {applyReplayCommand}=await import('../apps/mobile/src/replay/bridge');
 const command={action:'reset-world' as const,session:'a'.repeat(32),request:'b'.repeat(32),activity:null};
 await applyReplayCommand(command);await applyReplayCommand(command);
 expect(f.fetch).toHaveBeenCalledTimes(1);
 const status=JSON.parse(f.files.get('private/sporeward-replay-status.json')!);
 expect(status.control.request).toBe(command.request);expect(status.control.error).toContain('not the dedicated');
});
