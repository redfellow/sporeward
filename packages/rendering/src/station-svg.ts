import {drawSurveyStation,type StationGradient,type SurveyStationCanvas} from './survey-station';

const n=(v:number)=>+v.toFixed(4);
function colour(value:string,attribute:string){
 return /^#[\da-f]{8}$/i.test(value)?`${attribute}="${value.slice(0,7)}" ${attribute==='stop-color'?'stop':attribute}-opacity="${n(parseInt(value.slice(7),16)/255)}"`:`${attribute}="${value}"`;
}
/** Small vector backend for the shared Canvas recipe; it contains no station artwork. */
export function surveyStationSvg(collected:boolean,time=0,bright=false):string {
 const shapes:string[]=[],definitions:string[]=[];
 type Gradient=StationGradient&{id:string};
 let path='',transform='';
 const stack:Record<string,unknown>[]=[];
 const fields=['lineCap','lineJoin','fillStyle','strokeStyle','lineWidth','globalAlpha','shadowColor','shadowBlur'] as const;
 const gradient=(attributes:string,tag:string):Gradient=>{
  const id=`g${definitions.length}`,stops:{offset:number;colour:string}[]=[];
  const index=definitions.length;definitions.push('');
  return {id,addColorStop:(offset,c)=>{stops.push({offset,colour:c});definitions[index]=`<${tag} id="${id}" gradientUnits="userSpaceOnUse" ${attributes}>${stops.map(s=>`<stop offset="${s.offset}" ${colour(s.colour,'stop-color')}/>`).join('')}</${tag}>`;}};
 };
 const push=(kind:'fill'|'stroke',d=path)=>{
  const style=kind==='fill'?ctx.fillStyle:ctx.strokeStyle;
  const ink=typeof style==='string'?colour(style,kind):`${kind}="url(#${(style as Gradient).id})"`;
  shapes.push(`<path d="${d}" transform="${transform}" opacity="${n(ctx.globalAlpha)}" ${ink} ${kind==='stroke'?`fill="none" stroke-width="${ctx.lineWidth}" stroke-linecap="${ctx.lineCap}" stroke-linejoin="${ctx.lineJoin}"`:''}/>`);
 };
 const ctx:SurveyStationCanvas={
  lineCap:'butt',lineJoin:'miter',fillStyle:'#000000',strokeStyle:'#000000',lineWidth:1,globalAlpha:1,shadowColor:'transparent',shadowBlur:0,
  save(){stack.push({...Object.fromEntries(fields.map(key=>[key,ctx[key]])),transform});},
  restore(){const prior=stack.pop()!;for(const key of fields)(ctx as unknown as Record<string,unknown>)[key]=prior[key];transform=prior.transform as string;},
  beginPath(){path='';},moveTo(x,y){path+=`M${n(x)} ${n(y)}`;},lineTo(x,y){path+=`L${n(x)} ${n(y)}`;},
  ellipse(x,y,rx,ry,rotation,start,end){
   const point=(angle:number)=>[x+rx*Math.cos(angle)*Math.cos(rotation)-ry*Math.sin(angle)*Math.sin(rotation),y+rx*Math.cos(angle)*Math.sin(rotation)+ry*Math.sin(angle)*Math.cos(rotation)];
   const a=point(start);path+=`${path?'L':'M'}${n(a[0])} ${n(a[1])}`;
   const steps=Math.max(1,Math.ceil((end-start)/Math.PI));
   for(let i=1;i<=steps;i++){const b=point(start+(end-start)*i/steps);path+=`A${rx} ${ry} ${n(rotation*180/Math.PI)} 0 1 ${n(b[0])} ${n(b[1])}`;}
  },
  arc(x,y,r,start,end){ctx.ellipse(x,y,r,r,0,start,end);},
  roundRect(x,y,w,h,r){path+=`M${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x+r}Q${x} ${y+h} ${x} ${y+h-r}V${y+r}Q${x} ${y} ${x+r} ${y}Z`;},
  fill(){push('fill');},stroke(){push('stroke');},
  fillRect(x,y,w,h){push('fill',`M${x} ${y}h${w}v${h}h${-w}Z`);},
  rotate(angle){transform+=` rotate(${n(angle*180/Math.PI)})`;},
  createLinearGradient(x1,y1,x2,y2){return gradient(`x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"`,'linearGradient');},
  createRadialGradient(_x1,_y1,_r1,x2,y2,r2){return gradient(`cx="${x2}" cy="${y2}" r="${r2}"`,'radialGradient');},
 };
 drawSurveyStation(ctx,collected,time,bright);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="-64 -64 128 128"><defs>${definitions.join('')}</defs>${shapes.join('')}</svg>`;
}
