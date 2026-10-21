import {useEffect,useMemo,useRef,useState} from 'react';
import {mapPalettes,membraneMotion,membranePoints,richerMembranes} from '@sporeward/rendering';
import {makeFootprint,type Point} from './footprint';
import {outline} from './material';
import './palette-study.css';
type Pigment={body:string;deep:string;rim:string;light:string};
const pigment=(body:string,deep:string,rim:string,light:string):Pigment=>({body,deep,rim,light});
const schemes=[
 {id:'ember',name:'Ember & violet',note:'Warm difficulty ladder · unmistakable violet remnants',easy:pigment('#f28a20','#bd4c0d','#ffbb51','#fff2b7'),medium:pigment('#ea6843','#a33324','#ffa082','#ffe1bd'),hard:pigment('#df4058','#8e173b','#ff8194','#ffd0da'),remnant:pigment('#aa7ce9','#5b388d','#dfb5ff','#f5e4ff'),clearing:pigment('#80cdc5','#699fc4','#ccfff3','#f1fff9'),signal:'#8cf0c9'},
 {id:'toxic',name:'Toxic & rose',note:'Lime-to-copper difficulty · rose remnants',easy:pigment('#a5bc3d','#526d24','#e1ef91','#f5ffce'),medium:pigment('#d6a342','#8d5924','#ffdd8c','#fff3c5'),hard:pigment('#d85a43','#832f30','#ff9b80','#ffdfcb'),remnant:pigment('#e889c3','#963c7a','#ffbce4','#ffe7f6'),clearing:pigment('#71c9d9','#5a82b0','#c1f6ff','#effdff'),signal:'#95e8ee'},
 {id:'crimson',name:'Crimson & ice',note:'Coral-to-wine difficulty · blue remnants',easy:pigment('#ef865c','#ae482e','#ffc092','#fff0ce'),medium:pigment('#df5162','#982c48','#ff9ca8','#ffe0e3'),hard:pigment('#aa3961','#631c43','#e97aab','#ffc4df'),remnant:pigment('#72b5ef','#385a9e','#b2ddff','#edf7ff'),clearing:pigment('#9bd4b1','#659f8c','#d5ffe2','#f3fff5'),signal:'#b8efca'}
];
type State='easy'|'medium'|'hard'|'visited'|'withering'|'clearing'|'remnant'|'cooldown'|'disintegrating'|'stabilizing';
const states:{id:State;name:string;hint:string;symbol:string}[]=[
 {id:'easy',name:'Light effort',hint:'A fresh outbreak that needs relatively few visits to clear.',symbol:'Ⅰ'},
 {id:'medium',name:'Medium effort',hint:'A more resistant outbreak; expect to contribute more visits.',symbol:'Ⅱ'},
 {id:'hard',name:'Heavy effort',hint:'The highest effort class, with the most visits needed to clear.',symbol:'Ⅲ'},
 {id:'remnant',name:'Remnant',hint:'A small fragment left after disintegration. One eligible touch clears it for its share of the cleanup bonus.',symbol:'✦'},
 {id:'withering',name:'Withering',hint:'Players have started cleaning this outbreak. It shrinks over time and may still need another visit.',symbol:'↓'},
 {id:'clearing',name:'Clearing',hint:'Committed cleaning is expected to finish it without another visit, though another player may still claim the finishing bonus.',symbol:'≈'},
 {id:'visited',name:'Visited this outing',hint:'You crossed this outbreak during the current outing. This marker can appear alongside its effort or cleaning state.',symbol:'✓'},
 {id:'cooldown',name:'On cooldown',hint:'Your previous visit is still within its cooldown, so you cannot earn another visit award here yet.',symbol:'◷'},
 {id:'disintegrating',name:'Disintegrating',hint:'The outbreak is near the end of its life. Visit normally before it breaks into separate remnants.',symbol:'⚡'},
 {id:'stabilizing',name:'Stabilizing',hint:'A split has created two targets. They are temporarily locked while the new boundaries settle; pending cleaning then resumes.',symbol:'⋯'}
];
function smooth(points:Point[]){const path=new Path2D(),last=points.at(-1)!;path.moveTo((last[0]+points[0][0])/2,(last[1]+points[0][1])/2);points.forEach((p,i)=>{const n=points[(i+1)%points.length];path.quadraticCurveTo(...p,(p[0]+n[0])/2,(p[1]+n[1])/2);});path.closePath();return path;}
function roundedRing(radius:number,seed:number):Point[]{return Array.from({length:64},(_,i)=>{const a=i/64*Math.PI*2,r=radius*(1+.065*Math.sin(a*3+seed)+.035*Math.cos(a*5-seed));return [Math.cos(a)*r,Math.sin(a)*r] as Point;});}
function hybridRing(radius:number,seed:number,amount:number):Point[]{return Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2,r=radius*(1+amount*(.65*Math.sin(a*3+seed)+.35*Math.cos(a*5-seed)+.2*Math.sin(a*7+seed*.7)));return [Math.cos(a)*r,Math.sin(a)*r] as Point;});}
function stabilizingPath(seed:number){
 const path=new Path2D(),radius=(a:number)=>74*(1+.16*Math.sin(a*3+seed)+.095*Math.cos(a*5-seed)+.045*Math.sin(a*7+seed*.7));
 const top=-radius(-Math.PI/2),bottom=radius(Math.PI/2);
 // Cut one organic silhouette into complementary halves, preserving a narrow winding gap.
 for(const side of [-1,1]){
  const points:Point[]=[],start=side===1?-Math.PI/2:Math.PI/2;
  for(let i=0;i<=48;i++){const a=start+i/48*Math.PI,r=radius(a);points.push([side*3+Math.cos(a)*r,Math.sin(a)*r]);}
  for(let i=0;i<=32;i++){const t=i/32,y=side===1?bottom+(top-bottom)*t:top+(bottom-top)*t;const u=(y-top)/(bottom-top);points.push([side*3+6*Math.sin(u*Math.PI*3)*Math.sin(u*Math.PI),y]);}
  path.addPath(smooth(points));
 }
 return path;
}
function swatch(state:State,scheme:typeof schemes[number]):Pigment{
 if(state==='remnant')return scheme.remnant;if(state==='clearing')return scheme.clearing;
 if(state==='cooldown')return pigment('#879693','#596f72','#becbc6','#e7eee9');if(state==='stabilizing')return scheme.clearing;
 if(state==='medium')return scheme.medium;if(state==='hard'||state==='disintegrating')return scheme.hard;return scheme.easy;
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
   ctx.save();ctx.translate(w/2,h/2);const size=state==='remnant'?.63:.86;ctx.scale(size,size);const path=state==='remnant'?smooth(roundedRing(69,seed)):state==='clearing'?smooth(hybridRing(80,seed,.15)):state==='stabilizing'?stabilizingPath(seed):outline(footprint.rings),inactive=state==='cooldown';
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
   for(const m of richerMembranes([0,0],77,seed)){
    const hurting=state==='withering'||state==='disintegrating'||state==='visited';
    const v=membraneMotion(m,hurting?0:time,seed),jitter=state==='disintegrating'?2.4:state==='withering'?1.5:0,shakeRate=state==='withering'?5.5:18;
    ctx.save();ctx.translate(m.center[0]+v.dx+Math.sin(time*shakeRate+m.seed)*jitter,m.center[1]+v.dy+Math.cos(time*shakeRate*1.27+m.seed*2)*jitter);ctx.transform(v.sx,v.ky,v.kx,v.sy,0,0);
    const points=membranePoints(m.radius,m.seed),blob=state==='disintegrating'?(()=>{const path=new Path2D();path.moveTo(...points[0]);for(let i=1;i<points.length;i+=Math.max(1,Math.floor(points.length/15))){const point=points[i],factor=i%2?1.12:.88;path.lineTo(point[0]*factor,point[1]*factor);}path.closePath();return path;})():smooth(points),g=ctx.createLinearGradient(-m.radius,-m.radius,m.radius,m.radius),colour=m.light?p.light:p.body;
    g.addColorStop(0,colour+'55');g.addColorStop(.6,colour+'20');g.addColorStop(1,p.body+'08');ctx.fillStyle=g;ctx.fill(blob);ctx.strokeStyle=state==='visited'?scheme.signal+'bb':(m.light?p.light:p.rim)+'85';ctx.lineWidth=state==='visited'?2.2:1.4;ctx.stroke(blob);
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
   if(state==='stabilizing'){
    // Two near-touching lobes retain one shared visual identity while their split settles.
    ctx.save();ctx.strokeStyle=p.deep;ctx.globalAlpha=.65;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(-3,-3);ctx.lineTo(-7,1);ctx.lineTo(2,5);ctx.lineTo(7,9);ctx.stroke();
    ctx.strokeStyle=p.light;ctx.globalAlpha=1;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(-3,-3);ctx.lineTo(-7,1);ctx.lineTo(2,5);ctx.lineTo(7,9);ctx.stroke();ctx.restore();
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
 const [selected,setSelected]=useState(0),[bright,setBright]=useState(false),[motion,setMotion]=useState(true),scheme=schemes[selected];
 return <main className={'palette-study'+(bright?' palette-study--bright':'')}>
  <header className="palette-study__header"><a href="/rendering/surfaces?shoreline">← Surface preview</a><p className="palette-study__eyebrow">SPOREWARD · VISUAL STUDY</p><h1>Recognise every kind of growth.</h1><p>A field guide to outbreak states. Compare their appearance and what each state means during play.</p></header>
  <div className="palette-study__toolbar"><div className="palette-study__schemes">{schemes.map((s,i)=><button key={s.id} aria-pressed={selected===i} onClick={()=>setSelected(i)}><span className="palette-study__dots">{[s.easy.body,s.hard.body,s.remnant.body,s.clearing.body].map(c=><i key={c} style={{background:c}}/>)}</span>{s.name}{i===0&&<small>Suggested</small>}</button>)}</div><div className="palette-study__toggles"><button aria-pressed={bright} onClick={()=>setBright(v=>!v)}>Bright map</button><button aria-pressed={!motion} onClick={()=>setMotion(v=>!v)}>{motion?'Pause motion':'Resume motion'}</button></div></div>
  <p className="palette-study__note">{scheme.note}. Difficulty follows one colour ladder; remnants have their own hue. Visited is an overlay that can coexist with any active state.</p>
  <section className="palette-study__grid" aria-label="Game state colour examples">{states.map(s=><article key={s.id} className={'palette-study__card'+(s.id==='remnant'?' palette-study__card--remnant':'')}><GrowthSample state={s.id} scheme={scheme} bright={bright} motion={motion}/><div className="palette-study__caption"><h2><span style={{color:swatch(s.id,scheme).rim}}>{s.symbol}</span>{s.name}</h2><p>{s.hint}</p></div></article>)}</section>
  <footer>State guide and visual study. These examples explain the current rules; the palette remains a proposal until selected.</footer>
 </main>;
}
