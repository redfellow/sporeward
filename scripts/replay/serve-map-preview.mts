/** Isolated emulator map fixture. Clock controls are in memory; no account or world data is mutated. */
import {createServer,type IncomingMessage} from 'node:http';
import {readFile} from 'node:fs/promises';
import {parseWorldView} from '@sporeward/protocol';
import {createShowcaseClock} from '../../apps/server/src/replay/showcase-clock.ts';
import {renderShowcase} from '../../apps/server/src/replay/showcase.ts';
const path=process.argv[2];if(!path)throw new Error('Provide an exported map fixture.');
const world=parseWorldView(JSON.parse(await readFile(path,'utf8')));
const port=Number(process.env.REPLAY_PREVIEW_PORT??3112);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid preview port.');
const authorization='Basic '+Buffer.from('emulator:emulator-only').toString('base64');
const clock=world.renderTest?createShowcaseClock():null;
async function readJson(req:IncomingMessage){
 let body='';for await(const chunk of req){body+=chunk.toString();if(body.length>1024)throw new Error('Control request is too large.');}
 return body?JSON.parse(body) as unknown:null;
}
async function currentWorld(){
 if(!clock)return {...world,serverTime:Date.now()};
 const state=clock.state();return renderShowcase(world.worldStartedAt,state.elapsedMinutes,state.paused);
}
const server=createServer((req,res)=>{void(async()=>{
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 if(req.headers.authorization!==authorization){res.writeHead(401);res.end(JSON.stringify({error:'Unauthorized'}));return;}
 if(req.method==='GET'&&req.url==='/world'){res.end(JSON.stringify(await currentWorld()));return;}
 if(req.method==='GET'&&req.url==='/health'){res.end(JSON.stringify({service:'sporeward',status:'ok',accounts:false,mode:clock?'isolated-render-showcase':'read-only-map-preview'}));return;}
 if(req.method==='POST'&&req.url==='/render-test/clock'&&clock){
  try{
   const value=await readJson(req);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Provide a clock action.');
   const action=(value as {action?:unknown}).action;
   if(action==='pause')clock.pause();else if(action==='resume')clock.resume();else if(action==='reset')clock.reset();
   else if(action==='advance')clock.advance((value as {minutes:number}).minutes);
   else throw new Error('Use pause, resume, advance or reset.');
   res.end(JSON.stringify(await currentWorld()));return;
  }catch(error){res.writeHead(400);res.end(JSON.stringify({error:error instanceof Error?error.message:'Invalid clock action.'}));return;}
 }
 res.writeHead(405);res.end(JSON.stringify({error:clock?'Only isolated render-test clock controls are available; restore the replay API before recording.':'Read-only map preview; restore the replay API before recording.'}));
})().catch(error=>{if(!res.headersSent)res.writeHead(500);if(!res.writableEnded)res.end(JSON.stringify({error:error instanceof Error?error.message:'Preview request failed.'}));});});
server.listen(port,'127.0.0.1',()=>console.log((clock?'Isolated render showcase':'Read-only map preview')+' on localhost:'+port+' with '+world.outbreaks.length+' outbreaks.'));
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>server.close());
