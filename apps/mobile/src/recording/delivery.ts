/** Capture delivery timing separately from GPS source time, without location coordinates. */
export function deliveryDiagnostic(timestamps:number[],received:number) {
 const times=timestamps.filter(Number.isFinite).sort((a,b)=>a-b);
 let gaps=0,maxGap=0;
 for(let i=1;i<times.length;i++) {const gap=times[i]-times[i-1];maxGap=Math.max(maxGap,gap);if(gap>2000) gaps++;}
 return {receivedAt:received,count:timestamps.length,firstFixAt:times[0]??null,lastFixAt:times.at(-1)??null,
  oldestLagMs:times.length?received-times[0]:null,newestLagMs:times.length?received-times.at(-1)!:null,
  withinBatchGapsOver2s:gaps,maxWithinBatchGapMs:maxGap};
}
