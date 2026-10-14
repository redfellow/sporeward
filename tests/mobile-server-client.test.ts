import { afterEach, expect, it, vi } from 'vitest';
import { authorization, checkConnection, SERVER_URL, type HealthRequest } from '../apps/mobile/src/server/client';
const credentials={username:'tester',password:'test-password'};
afterEach(()=>vi.useRealTimers());
it('encodes UTF-8 credentials and rejects invalid usernames before any network request',async()=> {
 expect(authorization({username:'pyöräilijä',password:'salasana🔒'})).toBe('Basic '+Buffer.from('pyöräilijä:salasana🔒').toString('base64'));
 const request=vi.fn<HealthRequest>();await expect(checkConnection({username:'bad:name',password:'p'},request)).rejects.toThrow('username');expect(request).not.toHaveBeenCalled();
});
it('checks only the fixed HTTPS health endpoint and validates its response',async()=> {
 const request=vi.fn<HealthRequest>().mockResolvedValue(new Response(JSON.stringify({service:'sporeward',status:'ok'})));
 await checkConnection(credentials,request);expect(request).toHaveBeenCalledWith(SERVER_URL+'/health',expect.objectContaining({headers:{Authorization:authorization(credentials)},redirect:'error'}));
 request.mockResolvedValue(new Response(JSON.stringify({service:'other',status:'ok'})));await expect(checkConnection(credentials,request)).rejects.toThrow('unexpected response');
});
it('reports rejected credentials, rate limits, and offline errors without exposing request details',async()=> {
 const request=vi.fn<HealthRequest>().mockResolvedValue(new Response(null,{status:401}));await expect(checkConnection(credentials,request)).rejects.toThrow('Authentication failed');
 request.mockResolvedValue(new Response(null,{status:429}));await expect(checkConnection(credentials,request)).rejects.toThrow('Too many');
 request.mockRejectedValue(new Error('raw transport error including private data'));await expect(checkConnection(credentials,request)).rejects.toThrow('Cannot reach the test server. Recording can continue offline.');
});
it('aborts a stalled connection check',async()=> {
 vi.useFakeTimers();const request=vi.fn<HealthRequest>().mockImplementation((_url,options)=>new Promise((_resolve,reject)=>options?.signal?.addEventListener('abort',()=>reject(new Error('aborted')))));
 const result=expect(checkConnection(credentials,request,100)).rejects.toThrow('Connection timed out');await vi.advanceTimersByTimeAsync(100);await result;
});
