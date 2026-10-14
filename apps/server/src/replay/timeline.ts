/** Explicit simulation time. No dependence on Date.now, timers or external state. */
export class SimulationClock {
 private value:number;
 constructor(readonly baseline:number){if(!Number.isSafeInteger(baseline)||baseline<=0)throw new Error('Invalid simulation baseline.');this.value=baseline;}
 now=()=>this.value;
 advance(milliseconds:number){if(!Number.isSafeInteger(milliseconds)||milliseconds<0||!Number.isSafeInteger(this.value+milliseconds))throw new Error('Invalid time advancement.');this.value+=milliseconds;}
 reset(){this.value=this.baseline;}
}
export type ScheduledEvent<T>={at:number;order:number;value:T};
export class ReplayTimeline<T> {
 private cursor=0;
 private state:'ready'|'playing'|'paused'|'finished'='ready';
 private readonly events:ScheduledEvent<T>[];
 constructor(readonly clock:SimulationClock,events:ScheduledEvent<T>[]) {
  if(events.some(e=>!Number.isSafeInteger(e.at)||e.at<clock.baseline||!Number.isSafeInteger(e.order)))throw new Error('Invalid replay schedule.');
  this.events=[...events].sort((a,b)=>a.at-b.at||a.order-b.order);
 }
 status(){return {state:this.state,now:this.clock.now(),processed:this.cursor,total:this.events.length,nextAt:this.events[this.cursor]?.at??null};}
 start(){if(this.state==='finished')throw new Error('Reset before restarting a finished replay.');this.state='playing';return this.due();}
 pause(){if(this.state==='playing')this.state='paused';}
 resume(){if(this.state==='paused'||this.state==='ready')this.state='playing';return this.due();}
 reset(){this.clock.reset();this.cursor=0;this.state='ready';}
 advance(milliseconds:number){if(this.state==='paused'||this.state==='ready')return [];this.clock.advance(milliseconds);return this.due();}
 next(){if(this.state!=='playing')return [];const at=this.events[this.cursor]?.at;if(at===undefined){this.state='finished';return [];}this.clock.advance(Math.max(0,at-this.clock.now()));return this.due();}
 private due():ScheduledEvent<T>[] {const result:ScheduledEvent<T>[]=[];if(this.state!=='playing')return result;while(this.cursor<this.events.length&&this.events[this.cursor].at<=this.clock.now())result.push(this.events[this.cursor++]);if(this.cursor===this.events.length)this.state='finished';return result;}
}
