/** Read-only emulator map fixture. No activity, account or world mutations. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {parseWorldView} from '@sporeward/protocol';
const path=process.argv[2];if(!path)throw new Error('Provide an exported map fixture.');
const world=parseWorldView(JSON.parse(await readFile(path,'utf8')));
const port=Number(process.env.REPLAY_PREVIEW_PORT??3112);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid preview port.');
const authorization='Basic '+Buffer.from('emulator:emulator-only').toString('base64');
const server=createServer((req,res)=>{
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 if(req.headers.authorization!==authorization){res.writeHead(401);res.end(JSON.stringify({error:'Unauthorized'}));return;}
 if(req.method==='GET'&&req.url==='/world'){res.end(JSON.stringify({...world,serverTime:Date.now()}));return;}
 if(req.method==='GET'&&req.url==='/health'){res.end(JSON.stringify({service:'sporeward',status:'ok',accounts:false,mode:'read-only-map-preview'}));return;}
 res.writeHead(405);res.end(JSON.stringify({error:'Read-only map preview; restore the replay API before recording.'}));
});
server.listen(port,'127.0.0.1',()=>console.log('Read-only map preview on localhost:'+port+' with '+world.outbreaks.length+' outbreaks.'));
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>server.close());
