/** Platform-neutral accepted Richer membranes. Coordinates are local geographic metres. */
export type Point=[number,number];
export const richerPalettes={
 amber:{body:'#f28a20',deep:'#bd4c0d',rim:'#ffbb51',light:'#fff2b7'},
 crimson:{body:'#e54c59',deep:'#a52240',rim:'#ff8991',light:'#ffd1ba'},
 clearing:{body:'#8fc9c4',deep:'#818ac3',rim:'#d5f1ee',light:'#f6fffc'},
 cooldown:{body:'#899b96',deep:'#637d78',rim:'#b7cbc2',light:'#e2ede7'}
};
export const mapPalettes={
 day:{ground:'#eeeee2',park:'#d5dfc5',water:'#97bdcb',building:'#d9d9ca',majorEdge:'#d0c2a2',major:'#f6e8c5',roadEdge:'#d4d6c9',road:'#fffdf2',trail:'#96b5a0',label:'#345347'},
 night:{ground:'#253b40',park:'#2d4944',water:'#142a40',building:'#2b4148',majorEdge:'#56605c',major:'#b4a47e',roadEdge:'#314a50',road:'#738c8c',trail:'#8cae9f',label:'#b5ccc7'}
};
export function random(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
export function identitySeed(identity:string){let n=2166136261;for(const c of identity)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function membranePoints(radius:number,seed:number):Point[]{
 const rng=random(seed),phase=rng()*Math.PI*2,stretch=.7+rng()*.6;
 return Array.from({length:32},(_,i)=>{const a=i/32*Math.PI*2,r=radius*(1+.2*Math.sin(a*3+phase)+.12*Math.sin(a*5-phase));return [Math.cos(a)*r*stretch,Math.sin(a)*r/stretch];});
}
export type Membrane={center:Point;radius:number;seed:number;index:number;small:boolean;light:boolean;core:boolean};
/** Same RNG consumption/order as the accepted browser study. */
export function richerMembranes(center:Point,radius:number,seed:number):Membrane[]{
 const rng=random(seed),result:Membrane[]=[];
 for(let i=0;i<17;i++)result.push({center:[center[0]+(rng()-.5)*radius*2.15,center[1]+(rng()-.5)*radius*2.15],radius:radius*(.13+rng()*.25),seed:seed*100+i,index:i,small:false,light:i%4===0,core:i%3===0});
 for(let i=0;i<10;i++)result.push({center:[center[0]+(rng()-.5)*radius*1.9,center[1]+(rng()-.5)*radius*1.9],radius:radius*(.045+rng()*.055),seed:seed*1000+i,index:i,small:true,light:i%3===0,core:false});
 return result;
}
/** Can execute on the native animation thread. No random generation per frame. */
export function membraneMotion(m:Membrane,time:number,shapeSeed:number){
 'worklet';
 if(m.small){const phase=shapeSeed*.3+m.index*2.1,pulse=Math.sin(time*(Math.PI*2/(3.5+m.index%3))+phase);return {dx:Math.sin(time*.95+phase)*7,dy:Math.cos(time*.78+phase)*5,sx:1+pulse*.09,sy:1-pulse*.06,kx:Math.cos(time*.7+phase)*.06,ky:Math.sin(time*.8+phase)*.07,opacity:.85+.15*pulse};}
 const phase=m.seed*.71,breath=Math.sin(time*(Math.PI*2/(6+m.index%5))+phase),sway=Math.sin(time*.52+phase);
 return {dx:sway*5,dy:Math.sin(time*.44+phase)*3.5,sx:1+breath*.055,sy:1-breath*.04,kx:sway*.05,ky:Math.sin(time*.39+phase)*.04,opacity:.94+.06*breath};
}
