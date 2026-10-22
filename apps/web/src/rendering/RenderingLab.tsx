import {useEffect,useMemo,useRef,useState} from 'react';
import map from './tampere-map.json';
import {contact,makeFootprint,type Point} from './footprint';
import {createMaterial,outline,type Palette} from './material';
import './rendering.css';
import materialUrl from './assets/spore-membrane.png';
import wetMaterialUrl from './assets/spore-wet-folds.png';
import {project} from './geography';
import {makeRoute,routeContacts} from './route';
import {drawGrowth,auditScale,type ScaleAudit} from './draw-growth';
const route=makeRoute(map.roads);
const water=map.water as Point[][][];
const presets=[{center:[-250,-20] as Point,radius:285,seed:71,palette:'amber' as Palette},{center:[410,180] as Point,radius:270,seed:164,palette:'crimson' as Palette},{center:[60,460] as Point,radius:230,seed:62,palette:'clearing' as Palette}];
// Keep shape generation independent of image loading and avoid rebuilding it during React's
// development remount. A small cache also makes revisiting a seed immediate.
const footprintCache=new Map<number,ReturnType<typeof buildFootprints>>();
function buildFootprints(seed:number){
 const occupied:Point[][][]=[];
 return presets.map(g=>{const footprint=makeFootprint({...g,seed:g.seed+seed},water,2,occupied);occupied.push(...footprint.polygons);return {...g,footprint};});
}
function footprintsFor(seed:number){
 let value=footprintCache.get(seed);if(!value){value=buildFootprints(seed);if(footprintCache.size>=4)footprintCache.delete(footprintCache.keys().next().value!);footprintCache.set(seed,value);}return value;
}
export function RenderingLab(){
 const [materialStyle,setMaterialStyle]=useState<'wet'|'membrane'>('wet');
 const [asset,setAsset]=useState<{image:HTMLImageElement;style:'wet'|'membrane'}>();
 const texture=asset?.image,loadedStyle=asset?.style??'wet';
 useEffect(()=>{const image=new Image();image.onload=()=>setAsset({image,style:materialStyle});image.src=materialStyle==='wet'?wetMaterialUrl:materialUrl;return()=>{image.onload=null;};},[materialStyle]);
 const canvas=useRef<HTMLCanvasElement>(null),[zoom,setZoom]=useState(.65),[grid,setGrid]=useState(false),[seed,setSeed]=useState(0),[contactText,setContactText]=useState('Move over the map to probe the exact contact footprint.');
 const [audit,setAudit]=useState<ScaleAudit|null>(null);
 const [boundary,setBoundary]=useState(false);
 const [routeIndex,setRouteIndex]=useState(0),[playing,setPlaying]=useState(false);
 const scene=useRef<ReturnType<typeof makeScene>|null>(null),view=useRef({x:-250,y:-20}),[revision,setRevision]=useState(0);
 function makeScene(){
  if(!texture)return [];
  return footprintsFor(seed).map(g=>({...g,material:g.footprint.rings.length?createMaterial(g.footprint,g.palette,texture,loadedStyle):null}));
 }
 useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setRouteIndex(i=>{if(i+10>=route.length-1){setPlaying(false);return route.length-1;}return i+10;}),100);return()=>clearInterval(timer);},[playing]);
 useEffect(()=>{scene.current=makeScene();setAudit(null);setRevision(n=>n+1);},[seed,texture,loadedStyle]);
 useEffect(()=>{
  const el=canvas.current!;let frame=0;
  const draw=()=>{
   const rect=el.getBoundingClientRect(),dpr=window.devicePixelRatio||1;el.width=rect.width*dpr;el.height=rect.height*dpr;
   const ctx=el.getContext('2d')!;ctx.scale(dpr,dpr);ctx.fillStyle='#c5c9a4';ctx.fillRect(0,0,rect.width,rect.height);ctx.translate(rect.width/2,rect.height/2);ctx.scale(zoom,zoom);ctx.translate(-view.current.x,-view.current.y);
   const path=(points:number[][])=>outline([points as Point[]]);
   ctx.fillStyle='#8d9f72';for(const park of map.parks)ctx.fill(path(park));
   ctx.fillStyle='#436c73';for(const polygon of water)ctx.fill(outline(polygon),'evenodd');
   ctx.strokeStyle='#8caaa0';ctx.lineWidth=4;for(const polygon of water)ctx.stroke(outline(polygon));
   ctx.fillStyle='#b2b09a';ctx.strokeStyle='#8b8b7a';ctx.lineWidth=.8;for(const b of map.buildings){ctx.fill(path(b));ctx.stroke(path(b));}
   for(const pass of [0,1])for(const road of map.roads){const major=/primary|secondary|tertiary/.test(road.kind),trail=/footway|path|cycleway/.test(road.kind);ctx.beginPath();road.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=pass===0?'#989b84':trail?'#e0dcc2':'#efebd6';ctx.lineWidth=(major?10:trail?2.5:6)+(pass===0?2:0);ctx.stroke();}
   for(const growth of scene.current??[])drawGrowth(ctx,growth,{grid,boundary,water});
   if(routeIndex>0){
    const track=route.slice(0,routeIndex+1).map(fix=>project(fix.coordinate));
    for(const [width,color] of [[7,'#fff8ed'],[3.8,'#f324ab']] as const){ctx.beginPath();track.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
    const p=track.at(-1)!;ctx.beginPath();ctx.arc(...p,7,0,Math.PI*2);ctx.fillStyle='#f324ab';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
   }
   ctx.fillStyle='#d9efeb';ctx.font='italic 22px Georgia';ctx.fillText('Iidesjärvi',744,1088);
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle='#173d30';ctx.lineWidth=2;const ruler=100*zoom;ctx.beginPath();ctx.moveTo(24,rect.height-90);ctx.lineTo(24+ruler,rect.height-90);ctx.stroke();ctx.fillStyle='#173d30';ctx.font='11px system-ui';ctx.fillText('100 m',24,rect.height-98);
  };
  const resize=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);});resize.observe(el);draw();return()=>{resize.disconnect();cancelAnimationFrame(frame);};
 },[zoom,grid,boundary,revision,routeIndex]);
 const allHits=useMemo(()=>scene.current?routeContacts(route,scene.current.map(g=>g.footprint)):new Map<number,number>(),[revision]);
 const hits=new Map([...allHits].filter(([,index])=>index<=routeIndex));
 const drag=useRef<{x:number;y:number}|null>(null);
 return <main className="render-lab"><canvas ref={canvas} onWheel={e=>setZoom(z=>Math.max(.25,Math.min(3,z*Math.exp(-e.deltaY*.001))))} onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={()=>drag.current=null} onPointerMove={e=>{
  if(drag.current){view.current.x-=(e.clientX-drag.current.x)/zoom;view.current.y-=(e.clientY-drag.current.y)/zoom;drag.current={x:e.clientX,y:e.clientY};setRevision(n=>n+1);}
  const rect=e.currentTarget.getBoundingClientRect(),p:Point=[(e.clientX-rect.left-rect.width/2)/zoom+view.current.x,(e.clientY-rect.top-rect.height/2)/zoom+view.current.y];
  const hit=scene.current?.find(g=>contact(p,g.footprint));setContactText(hit?`${hit.palette.toUpperCase()} · inside contact footprint`:'Outside every outbreak · no contact');
 }}/><header><div className="lab-wordmark">SPOREWARD</div><span>{texture&&loadedStyle===materialStyle?'Living material study · Iidesjärvi, Tampere':'Preparing fungal material…'}</span></header><aside><details><summary>Render controls</summary><strong>Continuous growth</strong><p>Geographic contours, translucent membranes and shoreline-constrained contacts.</p><div className="zoom-buttons">{[['District',.4],['Neighbourhood',.8],['Close',1.7]].map(([label,value])=><button key={label} onClick={()=>setZoom(Number(value))}>{label}</button>)}</div><div className="zoom-buttons">{presets.map(g=><button key={g.palette} onClick={()=>{view.current={x:g.center[0],y:g.center[1]};setZoom(1.3);setRevision(n=>n+1);}}>{g.palette}</button>)}</div><div className="zoom-buttons"><button aria-pressed={materialStyle==='wet'} onClick={()=>setMaterialStyle('wet')}>Wet folds</button><button aria-pressed={materialStyle==='membrane'} onClick={()=>setMaterialStyle('membrane')}>Membranes</button></div><label><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/> Bookkeeping cells</label><label><input type="checkbox" checked={boundary} onChange={e=>setBoundary(e.target.checked)}/> Exact contact boundary</label><button onClick={()=>setSeed(s=>s+53)}>New growth shapes</button><div className="replay-controls"><button onClick={()=>{if(routeIndex===route.length-1)setRouteIndex(0);setPlaying(p=>!p);}}>{playing?'Pause replay':'Replay GPS outing'}</button><input aria-label="GPS replay progress" type="range" min="0" max={route.length-1} value={routeIndex} onChange={e=>{setPlaying(false);setRouteIndex(Number(e.target.value));}}/><small>{routeIndex} / {route.length-1} seconds · {hits.size} outbreaks contacted</small></div><button onClick={()=>setAudit(auditScale(scene.current??[]))}>Check rendering scale</button>{audit&&<small role="status">{audit.pass?'PASS':'FAIL'} · {audit.samples} renders · {audit.maxDifferenceMetres.toFixed(2)} m zoom variation · {audit.outwardMetres.toFixed(2)} m halo reach</small>}<small>Drag to pan · scroll to zoom</small></details></aside><footer><span>{contactText}</span><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></footer></main>;
}
