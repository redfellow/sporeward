import {growthContours} from './growth-contours';
import {guideBadgeSvg,guideFractures,guideHaloStrokes,guideMembraneMotion,guideMembranePoints,guidePigment,guideScheme,type GuideState} from './outbreak-guide';
import {guideCrackedRings,guideRoundedRing,guideClearingRing,guideSplittingPaths,guideRemnantDroplets,type ShapePoint,type ShapeCommand} from './outbreak-shapes';
import {richerMembranes,membranePoints,mapPalettes} from './richer';

const n=(value:number)=>+value.toFixed(3),seed=71;
let ordinary:ShapePoint[][]|undefined;
function outline(points:ShapePoint[]){return `M${points.map(([x,y])=>`${n(x)} ${n(y)}`).join('L')}Z`;}
function smooth(points:ShapePoint[]){const last=points.at(-1)!,first=points[0];return `M${n((last[0]+first[0])/2)} ${n((last[1]+first[1])/2)}`+points.map(([x,y],i)=>{const next=points[(i+1)%points.length];return `Q${n(x)} ${n(y)} ${n((x+next[0])/2)} ${n((y+next[1])/2)}`;}).join('')+'Z';}
function commands(path:ShapeCommand[]){return path.map(c=>c.op==='close'?'Z':c.op==='quad'?`Q${c.control.map(n).join(' ')} ${c.point.map(n).join(' ')}`:`${c.op==='move'?'M':'L'}${c.point.map(n).join(' ')}`).join('');}

/** Offline native-guide adapter for the accepted desktop recipes, not a world. */
export function guideSpecimenSvg(state:GuideState,bright=false,time=0):string{
 ordinary??=growthContours({center:[0,0],radius:77,seed},4);
 const p=guidePigment(state),map=mapPalettes[bright?'day':'night'],inactive=state==='cooldown'||state==='visited';
 const shape=state==='remnant'?smooth(guideRoundedRing(69,seed)):state==='clearing'?smooth(guideClearingRing(80,seed,.15)):state==='stabilizing'?guideSplittingPaths(seed).map(commands).join(''):state==='cracking'?guideCrackedRings(ordinary).map(outline).join(''):ordinary.map(outline).join('');
 const size=state==='remnant'?.63:state==='easy'?.43:state==='medium'?.86/Math.sqrt(2):.86;
 const halo=guideHaloStrokes.map(band=>`<path d="${shape}" fill="none" stroke="${p.body}" stroke-width="${band.width}" opacity="${band.opacity}" stroke-linejoin="round"/>`).join('');
 const definitions=[`<clipPath id="body"><path d="${shape}" fill-rule="evenodd" clip-rule="evenodd"/></clipPath>`];
 const fractures=state==='disintegrating'?guideFractures.flatMap((line,index)=>Array.from({length:line.length/2-1},(_,i)=>{
  const count=line.length/2-1,base=index===0?1.9:index<6?1.05:.55,width=base*Math.pow(1-i/count,1.4)+.12,d=`M${line[i*2]} ${line[i*2+1]}L${line[i*2+2]} ${line[i*2+3]}`;
  return `<path d="${d}" fill="none" stroke="${p.deep}" opacity=".6" stroke-width="${n(width+1.6)}"/><path d="${d}" fill="none" stroke="${p.light}" opacity=".98" stroke-width="${n(width)}"/>`;
 })).join(''):'';
 const membranes=richerMembranes([0,0],77,seed).map((source,index)=>{
  const m=state==='stabilizing'?{...source,center:[source.center[0]*1.18,source.center[1]*1.3] as ShapePoint}:source;
  const v=guideMembraneMotion(m,time,seed,state),points=guideMembranePoints(m,state),blob=state==='disintegrating'?outline(points):smooth(points),colour=m.light?p.light:p.body;
  definitions.push(`<linearGradient id="m${index}" x1="${-m.radius}" y1="${-m.radius}" x2="${m.radius}" y2="${m.radius}" gradientUnits="userSpaceOnUse"><stop stop-color="${colour}" stop-opacity=".333"/><stop offset=".6" stop-color="${colour}" stop-opacity=".125"/><stop offset="1" stop-color="${p.body}" stop-opacity=".031"/></linearGradient>`);
  return `<g transform="translate(${n(m.center[0]+v.dx)} ${n(m.center[1]+v.dy)}) matrix(${n(v.sx)} ${n(v.ky)} ${n(v.kx)} ${n(v.sy)} 0 0)"><path d="${blob}" fill="url(#m${index})" stroke="${m.light?p.light:p.rim}" stroke-opacity=".52" stroke-width="1.4"/>${m.core?`<path d="${smooth(membranePoints(m.radius*.57,m.seed+8))}" fill="${p.deep}" fill-opacity=".125"/>`:''}</g>`;
 }).join('');
 const rim=state==='withering'||state==='visited'?guideScheme.signal:p.rim,strokeWidth=state==='visited'?4:state==='withering'||state==='disintegrating'?3.5:state==='stabilizing'?2.8:1.8;
 const dash=state==='withering'||state==='disintegrating'?'stroke-dasharray=".5 8"':state==='cooldown'?'stroke-dasharray="2 5"':'';
 const droplets=state==='remnant'?guideRemnantDroplets().map(d=>`<ellipse cx="${n(d.x)}" cy="${n(d.y)}" rx="${d.rx}" ry="${n(d.ry)}" transform="rotate(${n(d.angle*180/Math.PI)} ${n(d.x)} ${n(d.y)})" fill="${p.body}" fill-opacity=".53" stroke="${p.rim}" stroke-width="1.8"/>`).join(''):'';
 const badge=guideBadgeSvg(state,bright).replace('width="96" height="96"','x="138" y="68" width="44" height="44"');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><defs>${definitions.join('')}</defs><rect width="320" height="180" fill="${map.ground}"/><path d="M0 0H80V117H0ZM240 99H320V180H240Z" fill="${map.park}"/><path d="M-10 136L330 58M96-10L218 190" stroke="${map.roadEdge}" stroke-width="7"/><path d="M-10 136L330 58M96-10L218 190" stroke="${map.road}" stroke-width="3"/><g transform="translate(160 90) scale(${size})" stroke-linecap="round" stroke-linejoin="round">${halo}<path d="${shape}" fill="${p.body}" fill-opacity="${state==='stabilizing'?.14:state==='clearing'?.12:inactive?.16:.28}" fill-rule="evenodd"/><g clip-path="url(#body)">${fractures}${membranes}</g><path d="${shape}" fill="none" stroke="${rim}" stroke-width="${strokeWidth}" ${dash}/>${droplets}</g>${badge}</svg>`;
}
