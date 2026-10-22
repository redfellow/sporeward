const MINUTE=60000;
export const SHOWCASE_CLOCK_LIMIT_MINUTES=720;
export type ShowcaseClockState={paused:boolean;elapsedMinutes:number;limitMinutes:number};

/** In-memory presentation clock; it never writes to replay or field-world storage. */
export function createShowcaseClock(now:()=>number=Date.now){
 let paused=true,elapsedMinutes=0,anchor=now();
 const sync=()=>{
  if(paused)return;
  const current=now(),elapsed=Math.max(0,Math.floor((current-anchor)/MINUTE));
  if(!elapsed)return;
  elapsedMinutes=Math.min(SHOWCASE_CLOCK_LIMIT_MINUTES,elapsedMinutes+elapsed);anchor+=elapsed*MINUTE;
  if(elapsedMinutes>=SHOWCASE_CLOCK_LIMIT_MINUTES)paused=true;
 };
 const state=():ShowcaseClockState=>{sync();return {paused,elapsedMinutes,limitMinutes:SHOWCASE_CLOCK_LIMIT_MINUTES};};
 return {
  state,
  pause(){sync();paused=true;return state();},
  resume(){if(elapsedMinutes>=SHOWCASE_CLOCK_LIMIT_MINUTES)throw new Error('Reset the showcase clock before resuming at its limit.');anchor=now();paused=false;return state();},
  advance(minutes:number){
   sync();if(!Number.isSafeInteger(minutes)||minutes<1||elapsedMinutes+minutes>SHOWCASE_CLOCK_LIMIT_MINUTES)throw new Error(`Advance the showcase clock by 1–${SHOWCASE_CLOCK_LIMIT_MINUTES-elapsedMinutes} whole minutes.`);
   elapsedMinutes+=minutes;if(elapsedMinutes>=SHOWCASE_CLOCK_LIMIT_MINUTES)paused=true;return state();
  },
  reset(){paused=true;elapsedMinutes=0;anchor=now();return state();},
 };
}
