export type Fix = { timestamp: number; latitude: number; longitude: number; accuracy: number | null; segment: number };
export function validFix(f: Fix, now: number): boolean {
 return Number.isFinite(f.timestamp) && f.timestamp > 0 && f.timestamp <= now + 5000 && Number.isFinite(f.latitude) && Math.abs(f.latitude) <= 90 && Number.isFinite(f.longitude) && Math.abs(f.longitude) <= 180 && (f.accuracy === null || Number.isFinite(f.accuracy) && f.accuracy >= 0);
}
export function summarize(fixes: Fix[]) {
 let meters = 0, maxGap = 0, gaps = 0;
 for (let i = 1; i < fixes.length; i++) {
  const a = fixes[i - 1], b = fixes[i];
  if (a.segment !== b.segment) continue;
  const gap = b.timestamp - a.timestamp;
  if (gap <= 0) continue;
  maxGap = Math.max(maxGap, gap); if (gap > 2000) gaps++;
  const rad = Math.PI / 180;
  const h = Math.sin((b.latitude-a.latitude)*rad/2)**2 + Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin((b.longitude-a.longitude)*rad/2)**2;
  meters += 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1,h)));
 }
 return { meters, maxGap, gaps, count: fixes.length, latest: fixes.at(-1) };
}

export type Segment = { id: number; activity: string; started: number; ended: number | null };
/** Time spent in recording segments, excluding pauses and known interruption gaps. */
export function recordingDuration(segments: Segment[], now: number) {
 return segments.reduce((total, s) => total + Math.max(0, (s.ended ?? now) - s.started), 0);
}
export function routeGeometry(fixes: Fix[]) {
 const lines: GeoJSON.Feature<GeoJSON.LineString>[] = [];
 const markers: GeoJSON.Feature<GeoJSON.Point>[] = [];
 let run: number[][] = [];
 const flush = () => { if(run.length > 1) lines.push({type:'Feature',properties:{kind:'recorded'},geometry:{type:'LineString',coordinates:run}});run=[]; };
 let previous: Fix | undefined;
 for(const fix of fixes) {
  const coordinate = [fix.longitude,fix.latitude];
  if(!previous || previous.segment !== fix.segment) {
   flush(); run=[coordinate]; markers.push({type:'Feature',properties:{role:'start'},geometry:{type:'Point',coordinates:coordinate}});
  } else if(fix.timestamp - previous.timestamp > 2000) {
   flush(); lines.push({type:'Feature',properties:{kind:'gap'},geometry:{type:'LineString',coordinates:[[previous.longitude,previous.latitude],coordinate]}});run=[coordinate];
  } else run.push(coordinate);
  previous=fix;
 }
 flush();
 if(previous) markers.push({type:'Feature',properties:{role:'latest'},geometry:{type:'Point',coordinates:[previous.longitude,previous.latitude]}});
 let bounds: [number,number,number,number] | null = null;
 for(const fix of fixes) {
  if(!bounds) bounds=[fix.longitude,fix.latitude,fix.longitude,fix.latitude];
  else {bounds[0]=Math.min(bounds[0],fix.longitude);bounds[1]=Math.min(bounds[1],fix.latitude);bounds[2]=Math.max(bounds[2],fix.longitude);bounds[3]=Math.max(bounds[3],fix.latitude);}
 }
 if(bounds) {bounds[0]-=0.001;bounds[1]=Math.max(-85,bounds[1]-0.001);bounds[2]+=0.001;bounds[3]=Math.min(85,bounds[3]+0.001);}

 return {lines:{type:'FeatureCollection' as const,features:lines},markers:{type:'FeatureCollection' as const,features:markers},bounds};
}
