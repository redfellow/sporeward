import {richerPalettes} from '@sporeward/rendering';
import type {WorldView} from '@sporeward/protocol';
type Outbreak=WorldView['outbreaks'][number];
export function outbreakPalette(o:Outbreak){
 if(o.eligibleAt>Date.now()||o.status==='cleared')return richerPalettes.cooldown;
 if(o.status==='clearing')return richerPalettes.clearing;
 if(o.lifecycle==='remnant')return {body:'#c8ad46',deep:'#8f742a',rim:'#f1de95',light:'#fff7c4'};
 if(o.lifecycle==='disintegrating')return {body:'#d46642',deep:'#993c31',rim:'#ffb58a',light:'#ffe3c2'};
 return o.visitsRemaining>5?richerPalettes.crimson:richerPalettes.amber;
}
export function outbreakAppearance(o:Outbreak){const p=outbreakPalette(o);return {bodyColor:p.body,rimColor:p.rim};}
/** Stable interior detail, bounded per outbreak; no particles or per-frame geometry. */
export function outbreakSpores(outbreaks:Outbreak[]) {
 const features:{type:'Feature';properties:{color:string};geometry:{type:'Point';coordinates:number[]}}[]=[];
 for(const o of outbreaks) {
  if(o.ring.length<3||o.status==='cleared')continue;
  const xs=o.ring.map(p=>p[0]),ys=o.ring.map(p=>p[1]);
  const west=Math.min(...xs),south=Math.min(...ys),width=Math.max(...xs)-west,height=Math.max(...ys)-south;
  let seed=2166136261;for(const c of o.id)seed=Math.imul(seed^c.charCodeAt(0),16777619);
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
  let count=0;
  for(let attempt=0;attempt<96&&count<16;attempt++) {
   const x=west+width*(.08+.84*random()),y=south+height*(.08+.84*random());let inside=false;
   for(let i=0,j=o.ring.length-1;i<o.ring.length;j=i++) {
    const a=o.ring[i],b=o.ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
   }
   if(!inside)continue;
   features.push({type:'Feature',properties:{color:o.status==='clearing'?'#effff7':'#fff0b5'},geometry:{type:'Point',coordinates:[x,y]}});count++;
  }
 }
 return {type:'FeatureCollection' as const,features};
}

function contains(ring:Outbreak['ring'],x:number,y:number) {
 let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
  const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;
}
/** Small irregular membrane loops give depth without changing the contact boundary. */
export function outbreakMembranes(outbreaks:Outbreak[]) {
 const features:{type:'Feature';properties:{color:string;shade:string};geometry:{type:'Polygon';coordinates:number[][][]}}[]=[];
 for(const o of outbreaks) {
  if(o.ring.length<3||o.status==='cleared')continue;
  const dots=outbreakSpores([o]).features;
  for(let n=0;n<Math.min(8,dots.length);n++) {
   const [x,y]=dots[n].geometry.coordinates,radius=9+(n*7%23),dy=radius/111320,dx=dy/Math.cos(y*Math.PI/180);
   const ring=Array.from({length:24},(_,i)=>{const a=i/24*Math.PI*2,f=1+.22*Math.sin(a*3+n)+.12*Math.cos(a*5+n*2);return [x+Math.cos(a)*dx*f,y+Math.sin(a)*dy*f];});
   if(!ring.every(p=>contains(o.ring,p[0],p[1])))continue;ring.push(ring[0]);
   const unavailable=o.eligibleAt>Date.now(),clearing=o.status==='clearing';
   features.push({type:'Feature',properties:{color:unavailable?'#dde4de':clearing?'#e7fff6':o.visitsRemaining>3?'#ff9e91':'#fff0af',shade:unavailable?'#7d948b':clearing?'#abb0dc':o.visitsRemaining>3?'#751c31':'#c16b1e'},geometry:{type:'Polygon',coordinates:[ring]}});
  }
 }
 return {type:'FeatureCollection' as const,features};
}
