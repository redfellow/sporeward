import {it,expect,vi} from 'vitest';
const alert=vi.hoisted(()=>vi.fn());
vi.mock('react-native',()=>({Alert:{alert}}));
import {confirmFinish} from '../apps/mobile/src/recording/confirm-finish';
it('requires explicit acceptance and resolves cancellation or dismissal safely',async()=>{
 const cancel=confirmFinish();alert.mock.lastCall![2][0].onPress();expect(await cancel).toBe(false);
 const dismiss=confirmFinish();alert.mock.lastCall![3].onDismiss();expect(await dismiss).toBe(false);
 const accept=confirmFinish();alert.mock.lastCall![2][1].onPress();alert.mock.lastCall![3].onDismiss();expect(await accept).toBe(true);
});
