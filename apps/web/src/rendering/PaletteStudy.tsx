import {useEffect,useMemo,useRef,useState} from 'react';
import {mapPalettes,membraneMotion,membranePoints,richerMembranes} from '@sporeward/rendering';
import {makeFootprint,type Point} from './footprint';
import {outline} from './material';
import './palette-study.css';
type Pigment={body:string;deep:string;rim:string;light:string};
const pigment=(body:string,deep:string,rim:string,light:string):Pigment=>({body,deep,rim,light});
const schemes=[
 {id:'ember',name:'Ember & violet',note:'Warm difficulty ladder · unmistakable violet remnants',easy:pigment('#f28a20','#bd4c0d','#ffbb51','#fff2b7'),medium:pigment('#ea6843','#a33324','#ffa082','#ffe1bd'),hard:pigment('#df4058','#8e173b','#ff8194','#ffd0da'),remnant:pigment('#aa7ce9','#5b388d','#dfb5ff','#f5e4ff'),clearing:pigment('#80cdc5','#699fc4','#ccfff3','#f1fff9'),signal:'#8cf0c9'},

];
type State='easy'|'medium'|'hard'|'visited'|'withering'|'clearing'|'remnant'|'cooldown'|'disintegrating'|'stabilizing'|'cracking';
const states:{id:State;name:string;hint:string;symbol:string}[]=[
 {id:'easy',name:'Light effort',hint:'Category 1: relatively few more visits needed. Light outbreaks cannot split.',symbol:'Ⅰ'},
 {id:'medium',name:'Medium effort',hint:'Category 2: a more resistant outbreak; expect to contribute more visits.',symbol:'Ⅱ'},
 {id:'hard',name:'Heavy effort',hint:'Category 3: the highest effort class, with the most visits needed to clear.',symbol:'Ⅲ'},
 {id:'disintegrating',name:'Disintegrating',hint:'Near the end of its life, this outbreak will break apart into remnants unless cleared first. You can still visit and clean it normally.',symbol:'ϟ'},
 {id:'remnant',name:'Remnants',hint:'Small fragments left after disintegration. One eligible touch clears each fragment for its share of the original cleanup bonus.',symbol:'✦'},
 {id:'withering',name:'Withering',hint:'Players have started cleaning this outbreak. It shrinks over time and may still need more visits.',symbol:'↓'},
 {id:'clearing',name:'Clearing',hint:'Committed cleaning is expected to finish it without another visit, though another player may still claim the finishing bonus.',symbol:'≈'},
 {id:'cracking',name:'Cracks forming',hint:'Repeated crossings by several players along the same road can form visible cracks. These may cause the outbreak to start splitting into two smaller outbreaks.',symbol:'⋈'},
 {id:'stabilizing',name:'Splitting',hint:'One outbreak is separating into two easier targets. Visits pause while the boundaries settle, then pending cleaning resumes. ',symbol:'⋯'},
 {id:'cooldown',name:'On cooldown',hint:'Your previous visit is still within its cooldown. You cannot earn another visit award here yet; the muted appearance shows that it is unavailable to you.',symbol:'◷'},
 {id:'visited',name:'Visited this outing',hint:'The same cooldown appearance, with a green border and check marking your contact during this outing. A check records contact, not necessarily a points award.',symbol:'✓'}
];
const cardFacts:Partial<Record<State,string[]>>={
 easy:['Growth → Medium','No splitting'],
 medium:['Growth → Heavy'],
 disintegrating:['Breaks apart → Remnants'],
 remnant:['1 eligible touch → Cleared'],
 withering:['Cleaning → Smaller'],
 clearing:['Enough treatment → Cleared'],
 cracking:['Repeated crossings → May split'],
 stabilizing:['Two smaller targets','Shared work · shared bonus'],
 cooldown:['Wait → Eligible again'],
 visited:['Muted + green → Visited']
};
function CardFacts({state}:{state:State}){return <div className="palette-study__facts">{cardFacts[state]?.map(fact=><p key={fact}>{fact}</p>)}</div>;}
function smooth(points:Point[]){const path=new Path2D(),last=points.at(-1)!;path.moveTo((last[0]+points[0][0])/2,(last[1]+points[0][1])/2);points.forEach((p,i)=>{const n=points[(i+1)%points.length];path.quadraticCurveTo(...p,(p[0]+n[0])/2,(p[1]+n[1])/2);});path.closePath();return path;}
function roundedRing(radius:number,seed:number):Point[]{return Array.from({length:64},(_,i)=>{const a=i/64*Math.PI*2,r=radius*(1+.065*Math.sin(a*3+seed)+.035*Math.cos(a*5-seed));return [Math.cos(a)*r,Math.sin(a)*r] as Point;});}
function hybridRing(radius:number,seed:number,amount:number):Point[]{return Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2,r=radius*(1+amount*(.65*Math.sin(a*3+seed)+.35*Math.cos(a*5-seed)+.2*Math.sin(a*7+seed*.7)));return [Math.cos(a)*r,Math.sin(a)*r] as Point;});}
function stabilizingPath(seed:number){
 const path=new Path2D(),radius=(a:number)=>74*(1+.20*Math.sin(a*3+seed)+.12*Math.cos(a*5-seed)+.065*Math.sin(a*7+seed*.7));
 const top=-radius(-Math.PI/2),bottom=radius(Math.PI/2);
 // Smooth outer silhouettes, but complementary straight-edged zipper seams.
 for(const side of [-1,1]){
  const points:Point[]=[],start=side===1?-Math.PI/2:Math.PI/2;
  for(let i=0;i<=48;i++){const a=start+i/48*Math.PI,r=radius(a);points.push([side*4+Math.cos(a)*r,Math.sin(a)*r]);}
  path.moveTo(...points[0]);
  for(let i=1;i<points.length-1;i++){const next=points[i+1];path.quadraticCurveTo(...points[i],(points[i][0]+next[0])/2,(points[i][1]+next[1])/2);}
  path.lineTo(...points[points.length-1]);
  for(let i=0;i<=24;i++){const t=i/24,y=side===1?bottom+(top-bottom)*t:top+(bottom-top)*t,u=(y-top)/(bottom-top);path.lineTo(side*4+7*Math.sin(u*Math.PI*12)*Math.sin(u*Math.PI),y);}
  path.closePath();
 }

 return path;
}
function crackingPath(rings:Parameters<typeof outline>[0]){
 const path=outline(rings),slit:Point[]=[[-59,28],[-33,13],[-18,17],[6,-4],[29,-7],[59,-25],[58,-28],[28,-10],[5,-7],[-19,14],[-34,10],[-60,25]];
 const gap=new Path2D();gap.moveTo(...slit[0]);for(const point of slit.slice(1))gap.lineTo(...point);gap.closePath();path.addPath(gap);return path;
}
function swatch(state:State,scheme:typeof schemes[number]):Pigment{
 if(state==='remnant')return scheme.remnant;if(state==='clearing')return scheme.clearing;
 if(state==='cooldown'||state==='visited')return pigment('#879693','#596f72','#becbc6','#e7eee9');if(state==='stabilizing')return scheme.clearing;
 if(state==='medium'||state==='cracking')return scheme.medium;if(state==='hard'||state==='disintegrating')return scheme.hard;return scheme.easy;
}
function GrowthSample({state,scheme,bright,motion}:{state:State;scheme:typeof schemes[number];bright:boolean;motion:boolean}){
 const ref=useRef<HTMLCanvasElement>(null),seed=71;
 const footprint=useMemo(()=>makeFootprint({center:[0,0],radius:77,seed},[],4),[]);
 useEffect(()=>{
  const canvas=ref.current!,ctx=canvas.getContext('2d')!,media=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,visible=true,last=0;
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});observer.observe(canvas);
  const draw=(now:number)=>{
   frame=requestAnimationFrame(draw);if(!visible||document.hidden||now-last<50)return;last=now;
   const w=canvas.clientWidth,h=180,dpr=Math.min(devicePixelRatio,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==h*dpr){canvas.width=Math.round(w*dpr);canvas.height=h*dpr;}
   const p=swatch(state,scheme),map=mapPalettes[bright?'day':'night'];ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle=map.ground;ctx.fillRect(0,0,w,h);
   ctx.fillStyle=map.park;ctx.fillRect(0,0,w*.25,h*.65);ctx.fillRect(w*.75,h*.55,w*.25,h*.45);
   ctx.lineWidth=7;ctx.strokeStyle=map.roadEdge;ctx.beginPath();ctx.moveTo(-10,136);ctx.lineTo(w+10,58);ctx.moveTo(w*.3,-10);ctx.lineTo(w*.68,h+10);ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle=map.road;ctx.stroke();
   ctx.fillStyle=map.building;for(let i=0;i<6;i++)ctx.fillRect(14+i*w/6,30+(i%2)*105,18,13);
   ctx.save();ctx.translate(w/2,h/2);const size=state==='remnant'?.63:state==='easy'?.43:state==='medium'?.86/Math.sqrt(2):.86;ctx.scale(size,size);const path=state==='remnant'?smooth(roundedRing(69,seed)):state==='clearing'?smooth(hybridRing(80,seed,.15)):state==='stabilizing'?stabilizingPath(seed):state==='cracking'?crackingPath(footprint.rings):outline(footprint.rings),inactive=state==='cooldown'||state==='visited';
   ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=p.body;
   const halo=state==='clearing'||state==='stabilizing'?38:state==='hard'?26:12;
   for(const [width,alpha] of (state==='stabilizing'?[]:[[halo,.035],[halo*.7,.055],[halo*.38,.1]])){ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.stroke(path);}ctx.globalAlpha=1;
   ctx.save();ctx.clip(path,'evenodd');ctx.fillStyle=p.body;ctx.globalAlpha=state==='stabilizing'?.14:state==='clearing'?.12:inactive?.16:.28;ctx.fill(path,'evenodd');ctx.globalAlpha=1;
   const time=motion&&!media.matches?now/1000:0;
   // The fracture sits below the moving membranes, as if the damage is inside the growth.
   if(state==='disintegrating'){
    ctx.save();ctx.clip(path,'evenodd');
    const cracks=[[-16,-95,3,-70,-10,-48,7,-29,-9,-15,12,1,-2,16,19,28,7,48,15,67,7,96],[3,-70,25,-77,34,-91],[7,-29,31,-39,43,-35],[-2,16,-28,11,-40,20],[19,28,42,24,55,8],[15,67,36,73,47,90]];
    const branches=[...cracks,[31,-39,39,-53,36,-63],[-28,11,-43,4,-53,9],[42,24,54,32,62,28],[25,-77,20,-85,24,-94],[36,73,48,66,59,69]];
    // Segment widths taper toward each tip; secondary forks remain hairline thin.
    for(const [index,line] of branches.entries()){
     const count=line.length/2-1;
     for(let i=0;i<count;i++){
      const t=i/count,base=index===0?1.9:index<6?1.05:.55,width=base*Math.pow(1-t,1.4)+.12;
      ctx.strokeStyle=p.deep;ctx.globalAlpha=.6;ctx.lineWidth=width+1.6;ctx.beginPath();ctx.moveTo(line[i*2],line[i*2+1]);ctx.lineTo(line[i*2+2],line[i*2+3]);ctx.stroke();
      ctx.strokeStyle=p.light;ctx.globalAlpha=.98;ctx.lineWidth=width;ctx.stroke();
     }
    }
    ctx.restore();
   }
   for(const source of richerMembranes([0,0],77,seed)){
    const m=state==='stabilizing'?{...source,center:[source.center[0]*1.18,source.center[1]*1.3] as Point}:source;
    const hurting=state==='withering'||state==='disintegrating'||state==='visited';
    const v=membraneMotion(m,hurting?0:time,seed),jitter=state==='disintegrating'?2.4:state==='withering'?1.5:0,shakeRate=state==='withering'?5.5:10;
    ctx.save();ctx.translate(m.center[0]+v.dx+Math.sin(time*shakeRate+m.seed)*jitter,m.center[1]+v.dy+Math.cos(time*shakeRate*1.27+m.seed*2)*jitter);ctx.transform(v.sx,v.ky,v.kx,v.sy,0,0);
    const points=membranePoints(m.radius,m.seed),blob=state==='disintegrating'?(()=>{const path=new Path2D();path.moveTo(...points[0]);for(let i=1;i<points.length;i+=Math.max(1,Math.floor(points.length/15))){const point=points[i],factor=.94+.18*Math.sin(i*2.39+m.seed)+.09*Math.cos(i*1.7-m.seed);path.lineTo(point[0]*factor,point[1]*factor);}path.closePath();return path;})():smooth(points),g=ctx.createLinearGradient(-m.radius,-m.radius,m.radius,m.radius),colour=m.light?p.light:p.body;
    g.addColorStop(0,colour+'55');g.addColorStop(.6,colour+'20');g.addColorStop(1,p.body+'08');ctx.fillStyle=g;ctx.fill(blob);ctx.strokeStyle=(m.light?p.light:p.rim)+'85';ctx.lineWidth=1.4;ctx.stroke(blob);
    if(m.core){const core=smooth(membranePoints(m.radius*.57,m.seed+8));ctx.fillStyle=p.deep+'20';ctx.fill(core);}ctx.restore();
   }
   if(state==='withering'||state==='clearing'||state==='visited'){
    ctx.globalAlpha=state==='clearing'?.24:.17;ctx.fillStyle=scheme.clearing.light;ctx.beginPath();ctx.ellipse(-25,0,38,110,-.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
   }
   ctx.restore();ctx.lineWidth=state==='visited'?4:state==='withering'||state==='disintegrating'?3.5:1.8;ctx.strokeStyle=state==='withering'||state==='visited'?scheme.signal:p.rim;
   if(state==='withering'||state==='disintegrating')ctx.setLineDash([.5,8]);if(state==='cooldown')ctx.setLineDash([2,5]);ctx.strokeStyle=state==='stabilizing'?p.rim:ctx.strokeStyle;ctx.lineWidth=state==='stabilizing'?2.8:ctx.lineWidth;ctx.stroke(path);ctx.setLineDash([]);
   if(state==='remnant'){
    ctx.fillStyle=p.body+'88';ctx.strokeStyle=p.rim;ctx.lineWidth=1.8;
    for(let i=0;i<15;i++){const a=i/15*Math.PI*2,r=86+(i%3)*9,x=Math.cos(a)*r,y=Math.sin(a)*r,small=3+(i*7%6);ctx.beginPath();ctx.ellipse(x,y,small,small*.8,a,0,Math.PI*2);ctx.fill();ctx.stroke();}
   }
   ctx.restore();
   const stateInfo=states.find(item=>item.id===state)!;
   ctx.fillStyle=bright?'#163c34':'#102c29';ctx.strokeStyle=state==='visited'?scheme.signal:p.rim;ctx.lineWidth=1.8;
   ctx.beginPath();ctx.arc(w/2,h/2,15,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';if(state==='disintegrating'){
    // A vector bolt avoids platform emoji colour and inconsistent glyph alignment.
    ctx.save();ctx.translate(w/2,h/2);ctx.beginPath();ctx.moveTo(2,-9);ctx.lineTo(-6,1);ctx.lineTo(0,1);ctx.lineTo(-2,9);ctx.lineTo(6,-2);ctx.lineTo(1,-2);ctx.closePath();ctx.fill();ctx.restore();
   }else ctx.fillText(stateInfo.symbol,w/2,h/2);
  };frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[state,scheme,bright,motion,footprint]);
 return <canvas ref={ref} role="img" aria-label={states.find(s=>s.id===state)!.name+' colour example'}/>;
}
export function PaletteStudy(){
 const [bright,setBright]=useState(false),[motion,setMotion]=useState(true),scheme=schemes[0];
 return <main className={'palette-study'+(bright?' palette-study--bright':'')}>
  <header className="palette-study__header"><a href="/rendering/surfaces?shoreline">← Surface preview</a><p className="palette-study__eyebrow">SPOREWARD · VISUAL STUDY</p><h1>Recognise every kind of growth.</h1><p>A field guide to outbreak states. Compare their appearance and what each state means during play.</p></header>
  <div className="palette-study__toolbar"><div className="palette-study__schemes"><span className="palette-study__locked"><span className="palette-study__dots">{[scheme.easy.body,scheme.hard.body,scheme.remnant.body,scheme.clearing.body].map(c=><i key={c} style={{background:c}}/>)}</span>Ember & violet · selected palette</span></div><div className="palette-study__toggles"><button aria-pressed={bright} onClick={()=>setBright(v=>!v)}>Bright map</button><button aria-pressed={!motion} onClick={()=>setMotion(v=>!v)}>{motion?'Pause motion':'Resume motion'}</button></div></div>
  <p className="palette-study__note">{scheme.note}. Difficulty follows one colour ladder; remnants have their own hue. Visited is an overlay that can coexist with any active state.</p>
  <h2 className="palette-study__section-title">Growths and their lifecycle</h2>
  <section className="palette-study__grid" aria-label="Outbreak types and lifecycle">{states.filter(s=>s.id!=='visited'&&s.id!=='cooldown').map(s=><article key={s.id} className={'palette-study__card'+(s.id==='remnant'?' palette-study__card--remnant':'')}><GrowthSample state={s.id} scheme={scheme} bright={bright} motion={motion}/><div className="palette-study__caption"><h2>{s.name}</h2><p>{s.hint}</p><CardFacts state={s.id}/></div></article>)}</section>
  <aside className="palette-study__reading" aria-label="Reading size and colour">
   <div><span className="palette-study__kicker">SIZE</span><h3>More ground, more growth</h3><div className="palette-study__mini-scale"><i className="guide-blob guide-blob--light"/><i className="guide-blob guide-blob--medium"/><i className="guide-blob guide-blob--heavy"/></div><p>Growth expands the footprint. Cleaning shrinks it gradually.</p></div>
   <div><span className="palette-study__kicker">COLOUR</span><h3>Colour looks ahead</h3><p>Effort colour already accounts for treatment on its way. A large growth can look Light before it shrinks. Pale means enough cleaning is committed to finish it.</p></div>
  </aside>
  <h2 className="palette-study__section-title">Your map markers</h2>
  <p className="palette-study__note">Muted means unavailable to you. Add a green border and check to mark contact during this outing.</p>
  <section className="palette-study__grid palette-study__grid--markers" aria-label="Your map markers">{states.filter(s=>s.id==='visited'||s.id==='cooldown').map(s=><article key={s.id} className="palette-study__card"><GrowthSample state={s.id} scheme={scheme} bright={bright} motion={motion}/><div className="palette-study__caption"><h2>{s.name}</h2><p>{s.hint}</p><CardFacts state={s.id}/></div></article>)}</section>
  <footer>Player guide to the agreed design. The examples illustrate the planned rules; app integration and balancing are still in progress.</footer>
 </main>;
}
