import {it,expect,vi,beforeEach} from 'vitest';
const mode=vi.hoisted(()=>vi.fn().mockResolvedValue(undefined));
vi.mock('../apps/mobile/src/server/session',()=>({rememberAccountMode:mode}));
import {fetchWorld} from '../apps/mobile/src/server/world';
beforeEach(()=>mode.mockClear());
it('learns that player login is required after a field server account cutover',async()=>{
 await expect(fetchWorld({username:'gateway',password:'disposable'},async()=>new Response(JSON.stringify({error:'Sign in to a tester account.'}),{status:401}))).rejects.toThrow('sign in to your tester account');
 expect(mode).toHaveBeenCalledWith(true);
});
it('does not mistake invalid gateway access for player-account activation',async()=>{
 await expect(fetchWorld({username:'gateway',password:'disposable'},async()=>new Response(JSON.stringify({error:'Unauthorized'}),{status:401}))).rejects.toThrow('connect and sign in');
 expect(mode).not.toHaveBeenCalled();
});
