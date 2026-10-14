import {resolve} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {ScenarioRunner} from '../../apps/server/src/replay/scenario.ts';
const path=process.argv[2];if(!path)throw new Error('Usage: npm run replay -- scenario.json [--interactive]');
const runs=new URL('../../work/replay/runs/',import.meta.url).pathname,runner=await ScenarioRunner.load(resolve(path),runs);
function show(summary:Awaited<ReturnType<typeof runner.summary>>){console.log(JSON.stringify({scenario:summary.scenario,clock:summary.clock,status:summary.status,players:summary.players,outings:summary.outings.map(o=>({player:o.player,id:o.id,visitPoints:o.recap.confirmedVisitPoints,cleanupPoints:o.recap.confirmedCleanupPoints,pending:o.recap.pendingCleanupPoints,contacts:o.recap.encounters.map(e=>({outbreak:e.name,result:e.reason}))})),outbreaks:summary.world.outbreaks.map(o=>({name:o.name,status:o.status,strength:o.strength,committed:o.committedCleaning,visitsRemaining:o.visitsRemaining}))},null,2));}
if(!process.argv.includes('--interactive'))show(await runner.run());
else {
 const input=createInterface({input:process.stdin,output:process.stdout});
 console.log('Commands: start, pause, resume, next, advance MINUTES, run, reset, status, quit. Accelerated server simulation; no emulator GPS injection.');
 try{while(true){const [command,arg]=(await input.question('replay> ')).trim().split(/\s+/);try{if(command==='quit')break;switch(command){case 'start':show(await runner.start());break;case 'pause':show(await runner.pause());break;case 'resume':show(await runner.resume());break;case 'next':show(await runner.next());break;case 'advance':show(await runner.advance(Number(arg)*60000));break;case 'run':show(await runner.run());break;case 'reset':show(await runner.reset());break;case 'status':show(await runner.summary());break;default:console.log('Unknown command.');}}catch(e){console.error(e instanceof Error?e.message:String(e));}}}finally{input.close();}
}
