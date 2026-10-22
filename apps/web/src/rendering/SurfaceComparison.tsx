import {useEffect,useRef,useState} from 'react';
import map from './tampere-map.json';
import {makeFootprint,random,type Point} from './footprint';
import {outline} from './material';
import './surface-comparison.css';

type Treatment='Simple'|'Layered'|'Richer';
const treatments:Treatment[]=['Simple','Layered','Richer'];
const descriptions={Simple:'Original translucent base · soft rim',Layered:'Simple base · overlapping translucent inner blobs',Richer:'More inner layers · stronger pigment variation'};
const palettes={amber:{body:'#f28a20',deep:'#bd4c0d',rim:'#ffbb51',light:'#fff2b7'},crimson:{body:'#e54c59',deep:'#a52240',rim:'#ff8991',light:'#ffd1ba'},clearing:{body:'#8fc9c4',deep:'#818ac3',rim:'#d5f1ee',light:'#f6fffc'}};
const specs=[{center:[-250,-20] as Point,radius:250,seed:71,palette:'amber' as const},{center:[340,130] as Point,radius:230,seed:164,palette:'crimson' as const},{center:[10,490] as Point,radius:190,seed:62,palette:'clearing' as const}];
type Scene='comparison'|'shoreline';
type MapTheme='day'|'night';
const mapColours={
 day:{ground:'#eeeee2',park:'#d5dfc5',water:'#97bdcb',building:'#d9d9ca',majorEdge:'#d0c2a2',major:'#f6e8c5',roadEdge:'#d4d6c9',road:'#fffdf2',trail:'#96b5a0',label:'#345347'},
 night:{ground:'#253b40',park:'#2d4944',water:'#142a40',building:'#2b4148',majorEdge:'#56605c',major:'#b4a47e',roadEdge:'#314a50',road:'#738c8c',trail:'#8cae9f',label:'#b5ccc7'}
};
const shoreSpecs=[{center:[-170,440] as Point,radius:300,seed:71,palette:'amber' as const},{center:[160,460] as Point,radius:300,seed:164,palette:'crimson' as const}];
const cached=new Map<Scene,ReturnType<typeof build>>();
function build(scene:Scene){
 const occupied:Point[][][]=[];
 return (scene==='shoreline'?shoreSpecs:specs).map(s=>{
  const footprint=makeFootprint(s,map.water as Point[][][],4,scene==='shoreline'?occupied:[]);
  if(scene==='shoreline'&&footprint.polygons.length>1){
   const area=(ring:Point[])=>Math.abs(ring.reduce((sum,a,i)=>{const b=ring[(i+1)%ring.length];return sum+a[0]*b[1]-b[0]*a[1];},0));
   footprint.polygons=[footprint.polygons.reduce((a,b)=>area(a[0])>=area(b[0])?a:b)];
   footprint.rings=footprint.polygons.flat();
  }
  occupied.push(...footprint.polygons);return {...s,footprint};
 });
}
function shapes(scene:Scene){let value=cached.get(scene);if(!value){value=build(scene);cached.set(scene,value);}return value;}

/** Rounded, irregular inner membranes, without sampling another growth field. */
function innerBlob(x:number,y:number,r:number,seed:number){
 const rng=random(seed),phase=rng()*Math.PI*2,stretch=.7+rng()*.6,points:Point[]=[];
 for(let i=0;i<32;i++){
  const angle=i/32*Math.PI*2,radius=r*(1+.2*Math.sin(angle*3+phase)+.12*Math.sin(angle*5-phase));
  points.push([x+Math.cos(angle)*radius*stretch,y+Math.sin(angle)*radius/stretch]);
 }
 const path=new Path2D(),mid=(a:Point,b:Point):Point=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 path.moveTo(...mid(points.at(-1)!,points[0]));
 points.forEach((p,i)=>path.quadraticCurveTo(...p,...mid(p,points[(i+1)%points.length])));path.closePath();return path;
}

function drawBackdrop(ctx:CanvasRenderingContext2D,width:number,height:number,zoom:number,offset:Point,theme:MapTheme){
 const colours=mapColours[theme];
 ctx.fillStyle=colours.ground;ctx.fillRect(0,0,width,height);
 ctx.save();ctx.translate(width/2,height/2);ctx.scale(zoom,zoom);ctx.translate(-offset[0],-offset[1]);
 ctx.fillStyle=colours.park;for(const park of map.parks)ctx.fill(outline([park as Point[]]));
 ctx.fillStyle=colours.water;for(const polygon of map.water)ctx.fill(outline(polygon as Point[][]),'evenodd');
 ctx.fillStyle=colours.building;for(const b of map.buildings)ctx.fill(outline([b as Point[]]));
 ctx.lineJoin='round';ctx.lineCap='round';
 for(const pass of [0,1])for(const road of map.roads){
  const major=/primary|secondary|tertiary/.test(road.kind),trail=/footway|path|cycleway/.test(road.kind);
  ctx.beginPath();road.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
  ctx.strokeStyle=pass===0?(major?colours.majorEdge:colours.roadEdge):(major?colours.major:trail?colours.trail:colours.road);ctx.lineWidth=(major?8:trail?3:5)+(pass===0?2:0);ctx.stroke();
 }
 ctx.restore();
}
function draw(ctx:CanvasRenderingContext2D,width:number,height:number,style:Treatment,zoom:number,offset:Point,scene:Scene,time:number,backdrop:HTMLCanvasElement,theme:MapTheme){
 ctx.drawImage(backdrop,0,0,width,height);
 ctx.save();ctx.translate(width/2,height/2);ctx.scale(zoom,zoom);ctx.translate(-offset[0],-offset[1]);
 ctx.lineJoin='round';ctx.lineCap='round';
 for(const s of shapes(scene)){
  const path=outline(s.footprint.rings),p=palettes[s.palette];
  // Geographic strokes and gradients: no texture decoding or pixel-by-pixel shading.
  ctx.save();ctx.strokeStyle=p.body;ctx.globalAlpha=.09;ctx.lineWidth=12;ctx.stroke(path);ctx.globalAlpha=.18;ctx.lineWidth=5;ctx.stroke(path);ctx.restore();
  ctx.save();ctx.clip(path,'evenodd');ctx.fillStyle=p.body;ctx.globalAlpha=.28;ctx.fill(path,'evenodd');ctx.globalAlpha=1;
  if(style!=='Simple'){
   const rng=random(s.seed);
   for(let i=0;i<(style==='Richer'?17:12);i++){
    const x=s.center[0]+(rng()-.5)*s.radius*2.15,y=s.center[1]+(rng()-.5)*s.radius*2.15,r=s.radius*(.13+rng()*.25),seed=s.seed*100+i;
    const phase=seed*.71,breath=Math.sin(time*(Math.PI*2/(6+i%5))+phase),sway=Math.sin(time*.52+phase);
    ctx.save();ctx.globalAlpha=.94+.06*breath;
    ctx.translate(x+sway*5,y+Math.sin(time*.44+phase)*3.5);
    ctx.transform(1+breath*.055,Math.sin(time*.39+phase)*.04,sway*.05,1-breath*.04,0,0);ctx.translate(-x,-y);
    const blob=innerBlob(x,y,r,seed),light=i%4===0;
    const g=ctx.createLinearGradient(x-r,y-r,x+r,y+r);
    g.addColorStop(0,(light?p.light:p.body)+(style==='Richer'?'55':'40'));
    g.addColorStop(.6,(light?p.light:p.body)+'20');g.addColorStop(1,p.body+'08');
    ctx.fillStyle=g;ctx.fill(blob);ctx.strokeStyle=(light?p.light:p.rim)+'85';ctx.lineWidth=1.4;ctx.stroke(blob);
    if(i%3===0){
     const core=innerBlob(x+r*.12,y-r*.1,r*.57,seed+8);
     ctx.fillStyle=p.deep+(style==='Richer'?'20':'14');ctx.fill(core);ctx.strokeStyle=p.rim+'60';ctx.lineWidth=1;ctx.stroke(core);
    }
    ctx.restore();
   }
   // Smaller, quicker currents give the slow membranes a second scale of life.
   if(style==='Richer')for(let i=0;i<10;i++){
    const x=s.center[0]+(rng()-.5)*s.radius*1.9,y=s.center[1]+(rng()-.5)*s.radius*1.9,r=s.radius*(.045+rng()*.055),phase=s.seed*.3+i*2.1;
    const pulse=Math.sin(time*(Math.PI*2/(3.5+i%3))+phase);
    ctx.save();ctx.translate(x+Math.sin(time*.95+phase)*7,y+Math.cos(time*.78+phase)*5);
    ctx.transform(1+pulse*.09,Math.sin(time*.8+phase)*.07,Math.cos(time*.7+phase)*.06,1-pulse*.06,0,0);
    const small=innerBlob(0,0,r,s.seed*1000+i);
    const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,(i%3===0?p.light:p.body)+'50');g.addColorStop(1,p.body+'0c');
    ctx.globalAlpha=.85+.15*pulse;ctx.fillStyle=g;ctx.fill(small);
    const rim=ctx.createLinearGradient(-r,-r,r,r);rim.addColorStop(0,p.light+'a0');rim.addColorStop(.5,p.rim+'90');rim.addColorStop(1,p.deep+'50');
    ctx.strokeStyle=rim;ctx.lineWidth=1.35;ctx.stroke(small);ctx.restore();
   }
  }
  ctx.restore();ctx.strokeStyle=p.rim;ctx.globalAlpha=.8;ctx.lineWidth=1.8;ctx.stroke(path);ctx.globalAlpha=1;
 }
 const route:Point[]=[[-650,210],[-430,150],[-260,180],[-145,95],[-60,155],[110,235],[220,350],[100,535],[230,640]];
 for(const [color,w] of [['#ffffff',7],['#e42fa5',3.7]] as const){ctx.beginPath();route.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();}
 ctx.restore();ctx.fillStyle=mapColours[theme].label;ctx.font='12px system-ui';ctx.fillText('Iidesjärvi · Tampere',16,height-18);
}

function Panel({style,zoom,offset,onPan,motion,theme='day',mapStudy=false,scene='comparison'}:{style:Treatment;zoom:number;offset:Point;scene?:Scene;theme?:MapTheme;mapStudy?:boolean;motion:boolean;onPan:(dx:number,dy:number)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),drag=useRef<Point|null>(null);
 useEffect(()=>{
  const el=canvas.current!,backdrop=document.createElement('canvas'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=-Infinity,visible=true,dirty=true;
  const render=(now:number)=>{
   if(!visible||document.hidden)return;
   if(now-last>=50||dirty){
    const rect=el.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
    if(dirty){
     el.width=backdrop.width=Math.round(rect.width*dpr);el.height=backdrop.height=Math.round(rect.height*dpr);
     const bg=backdrop.getContext('2d')!;bg.scale(dpr,dpr);drawBackdrop(bg,rect.width,rect.height,zoom,offset,theme);dirty=false;
    }
    const ctx=el.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);
    draw(ctx,rect.width,rect.height,style,zoom,offset,scene,motion&&!reduced.matches?now/1000:0,backdrop,theme);last=now;
   }
   if(motion&&!reduced.matches&&style!=='Simple')frame=requestAnimationFrame(render);
  };
  const restart=()=>{cancelAnimationFrame(frame);last=-Infinity;frame=requestAnimationFrame(render);};
  const resize=new ResizeObserver(()=>{dirty=true;restart();});resize.observe(el);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)restart();else cancelAnimationFrame(frame);});intersection.observe(el);
  document.addEventListener('visibilitychange',restart);reduced.addEventListener('change',restart);restart();
  return()=>{cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',restart);reduced.removeEventListener('change',restart);};
 },[style,zoom,offset,scene,motion,theme]);
 return <section className="surface-panel"><div className="surface-caption"><h2>{mapStudy?(theme==='day'?'Day · meadow & stone':'Night · deep teal'):scene==='shoreline'?'Richer · shoreline & neighbours':style}</h2><p>{mapStudy?(theme==='day'?'Warm ground, muted parks and clear blue water.':'Quiet buildings, dark water and readable paths.'):scene==='shoreline'?'Two separate outbreaks press against one another. The lake clips both footprints; the second grows around occupied ground.':descriptions[style]}</p></div><canvas ref={canvas} aria-label={`${style} outbreak treatment on a ${theme} Tampere map`} onPointerDown={e=>{drag.current=[e.clientX,e.clientY];e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onPointerMove={e=>{if(!drag.current)return;onPan((e.clientX-drag.current[0])/zoom,(e.clientY-drag.current[1])/zoom);drag.current=[e.clientX,e.clientY];}}/></section>;
}
export function SurfaceComparison(){
 const [scene,setScene]=useState<Scene>(new URLSearchParams(location.search).has('shoreline')?'shoreline':'comparison');
 const [motion,setMotion]=useState(true);
 const [mapStudy,setMapStudy]=useState(new URLSearchParams(location.search).has('palettes'));
 const [zoom,setZoom]=useState(.34),[offset,setOffset]=useState<Point>(scene==='shoreline'?[0,500]:[20,220]);
 return <main className="surface-study"><header><div><span className="surface-brand">SPOREWARD / SURFACE STUDY</span><h1>{mapStudy?'A map for the spores.':'Less texture. More map.'}</h1><p>{mapStudy?'Identical Richer outbreaks and motion. Compare map colours; drag either map to pan both.':scene==='shoreline'?'Richer beside Iidesjärvi: shoreline constraints and two competing footprints. Drag to explore.':'Same shapes, route and map in all three. Drag any map to pan them together.'}</p></div><nav aria-label="Map zoom"><button aria-pressed={mapStudy} onClick={()=>setMapStudy(m=>!m)}>Day & night palettes</button><button aria-pressed={motion} onClick={()=>setMotion(m=>!m)}>{motion?'Pause motion':'Animate layers'}</button><button aria-pressed={scene==='shoreline'} onClick={()=>{setScene(s=>s==='shoreline'?'comparison':'shoreline');setOffset(scene==='shoreline'?[20,220]:[0,500]);setZoom(.34);}}>Shoreline & neighbours</button>{[['District',.34],['Neighbourhood',.65],['Close',1.1]].map(([label,value])=><button key={label} aria-pressed={zoom===value} onClick={()=>setZoom(Number(value))}>{label}</button>)}<button onClick={()=>{setZoom(.34);setOffset(scene==='shoreline'?[0,500]:[20,220]);}}>Reset</button></nav></header><div className={'surface-panels'+(mapStudy?' map-palettes':'')} style={!mapStudy&&scene==='shoreline'?{gridTemplateColumns:'1fr'}:undefined}>{mapStudy?(['day','night'] as const).map(theme=><Panel key={theme} theme={theme} mapStudy motion={motion} style="Richer" scene={scene} zoom={zoom} offset={offset} onPan={(dx,dy)=>setOffset(([x,y])=>[x-dx,y-dy])}/>):scene==='shoreline'?<Panel motion={motion} style="Richer" scene={scene} zoom={zoom} offset={offset} onPan={(dx,dy)=>setOffset(([x,y])=>[x-dx,y-dy])}/>:treatments.map(style=><Panel motion={motion} key={style} style={style} zoom={zoom} offset={offset} onPan={(dx,dy)=>setOffset(([x,y])=>[x-dx,y-dy])}/>)}</div><footer>Lightweight vector and gradient preview · no photographic texture · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></footer></main>;
}
