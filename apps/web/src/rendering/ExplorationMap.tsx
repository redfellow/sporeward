import {useEffect,useRef} from 'react';
import {drawSurveyStation,RESISTANCE_HUE,resistanceContour,resistanceHazeStops,resistanceTint,resistanceContourColour,mapPalettes,membraneMotion,membranePoints,richerMembranes,type Membrane} from '@sporeward/rendering';
import map from './tampere-map.json';
import {makeFootprint,type Point} from './footprint';
import {outline} from './material';

// All geometry is an isolated illustration over the bundled OSM snapshot.
const viewCentre:Point=[-50,130],fieldCentre:Point=[-260,140],labPosition:Point=[412,-237];
const fieldRadius=670,hue=RESISTANCE_HUE;
const pigments={amber:{body:'#f28a20',deep:'#bd4c0d',rim:'#ffbb51',light:'#fff2b7'},cooldown:{body:'#879693',deep:'#596f72',rim:'#becbc6',light:'#e7eee9'}};
const smooth=(points:Point[])=>{
 const path=new Path2D(),last=points.at(-1)!;
 path.moveTo((last[0]+points[0][0])/2,(last[1]+points[0][1])/2);
 points.forEach((p,i)=>{const next=points[(i+1)%points.length];path.quadraticCurveTo(...p,(p[0]+next[0])/2,(p[1]+next[1])/2);});
 path.closePath();return path;
};
function makeGrowth(center:Point,radius:number,seed:number,palette:keyof typeof pigments){
 const footprint=makeFootprint({center,radius,seed},map.water as Point[][][],4);
 return {center,radius,seed,palette,path:outline(footprint.rings),membranes:richerMembranes(center,radius,seed).map(m=>({...m,path:smooth(membranePoints(m.radius,m.seed)),corePath:m.core?smooth(membranePoints(m.radius*.57,m.seed+8)):null}))};
}
type Growth=ReturnType<typeof makeGrowth>;
let growths:Growth[]|undefined;
function sceneGrowths(){return growths??=( [makeGrowth([-540,95],210,71,'amber'),makeGrowth([365,335],155,164,'cooldown')] );}

function drawBase(ctx:CanvasRenderingContext2D,bright:boolean,roads:boolean){
 const p=mapPalettes[bright?'day':'night'];
 ctx.lineCap='round';ctx.lineJoin='round';
 if(!roads){
  ctx.fillStyle=p.ground;ctx.fillRect(-4000,-4000,8000,8000);
  ctx.fillStyle=p.park;for(const polygon of map.parks)ctx.fill(outline([polygon as Point[]]));
  ctx.fillStyle=p.water;for(const polygon of map.water)ctx.fill(outline(polygon as Point[][]),'evenodd');
  ctx.fillStyle=p.building;for(const polygon of map.buildings)ctx.fill(outline([polygon as Point[]]));
  return;
 }
 for(const pass of [0,1])for(const road of map.roads){
  const major=/primary|secondary|tertiary/.test(road.kind),trail=/footway|path|cycleway/.test(road.kind);
  ctx.beginPath();road.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
  ctx.strokeStyle=pass===0?(major?p.majorEdge:p.roadEdge):(major?p.major:trail?p.trail:p.road);
  ctx.lineWidth=(major?8:trail?2.3:4)+(pass===0?2:0);
  ctx.globalAlpha=trail?.64:1;ctx.stroke();
 }
 ctx.globalAlpha=1;
}

function drawField(ctx:CanvasRenderingContext2D,resistance:number,bright:boolean,zoom:number){
 if(resistance<=0)return;
 ctx.save();ctx.translate(...fieldCentre);
 const haze=ctx.createRadialGradient(0,0,0,0,0,fieldRadius);
 for(const [stop,alpha] of resistanceHazeStops)haze.addColorStop(stop,resistanceTint(bright,resistance*alpha));
 ctx.fillStyle=haze;ctx.fillRect(-fieldRadius,-fieldRadius,fieldRadius*2,fieldRadius*2);
 // Circular influence, with slight irregularity in its visual isobands only.
 for(let band=0;band<6;band++){
  const points=resistanceContour(fieldRadius,band);
  ctx.strokeStyle=resistanceContourColour(bright);ctx.globalAlpha=resistance*(.65-band*.055);
  ctx.lineWidth=(band===5?1.2:.9)/zoom;ctx.stroke(smooth(points));
 }
 ctx.globalAlpha=resistance*.95;ctx.strokeStyle=`hsl(${hue} 45% ${bright?33:88}%)`;ctx.lineWidth=1.2/zoom;
 ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.stroke();
 ctx.beginPath();ctx.moveTo(-21,0);ctx.lineTo(-15,0);ctx.moveTo(15,0);ctx.lineTo(21,0);ctx.moveTo(0,-21);ctx.lineTo(0,-15);ctx.moveTo(0,15);ctx.lineTo(0,21);ctx.stroke();
 ctx.restore();
}

function drawGrowth(ctx:CanvasRenderingContext2D,g:Growth,time:number){
 const p=pigments[g.palette];ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.strokeStyle=p.body;
 for(const [width,alpha] of [[14,.035],[9,.055],[4.5,.1]]){ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.stroke(g.path);}
 ctx.globalAlpha=1;ctx.save();ctx.clip(g.path,'evenodd');ctx.fillStyle=p.body;ctx.globalAlpha=g.palette==='cooldown'?.16:.28;ctx.fill(g.path,'evenodd');ctx.globalAlpha=1;
 for(const m of g.membranes){
  const v=membraneMotion(m as Membrane,time,g.seed);
  ctx.save();ctx.translate(m.center[0]+v.dx,m.center[1]+v.dy);ctx.transform(v.sx,v.ky,v.kx,v.sy,0,0);ctx.globalAlpha=v.opacity;
  const gradient=ctx.createLinearGradient(-m.radius,-m.radius,m.radius,m.radius),colour=m.light?p.light:p.body;
  gradient.addColorStop(0,colour+'55');gradient.addColorStop(.6,colour+'20');gradient.addColorStop(1,p.body+'08');
  ctx.fillStyle=gradient;ctx.fill(m.path);ctx.strokeStyle=(m.light?p.light:p.rim)+'85';ctx.lineWidth=1.4;ctx.stroke(m.path);
  if(m.corePath){ctx.fillStyle=p.deep+'20';ctx.fill(m.corePath);}ctx.restore();
 }
 ctx.restore();ctx.strokeStyle=g.palette==='cooldown'?'#8cf0c9':p.rim;ctx.lineWidth=g.palette==='cooldown'?4:1.8;ctx.stroke(g.path);ctx.restore();
}


export function ExplorationMap({bright,motion,resistance,visible,collected,player}:{bright:boolean;motion:boolean;resistance:number;visible:boolean;collected:boolean;player:string}){
 const ref=useRef<HTMLCanvasElement>(null);
 const backdrop=useRef<{key:string;ground:HTMLCanvasElement;roads:HTMLCanvasElement}|null>(null);
 useEffect(()=>{
  const canvas=ref.current!,ctx=canvas.getContext('2d')!;
  const layers=backdrop.current??={key:'',ground:document.createElement('canvas'),roads:document.createElement('canvas')};
  const {ground,roads}=layers;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const growths=sceneGrowths();
  // Keep the personal field out of translucent outbreak interiors, so contours
  // cannot read as markings on top of the growth's accepted material.
  const fieldMask=new Path2D();fieldMask.rect(-4000,-4000,8000,8000);
  for(const growth of growths)fieldMask.addPath(growth.path);
  let frame=0,last=-Infinity,dirty=true,inView=false;
  const draw=(now:number)=>{
   if(!inView||document.hidden)return;
   const animated=motion&&!media.matches;
   if(dirty||now-last>50){
    const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2),zoom=Math.min(width/1900,height/1150);
    if(width===0||height===0)return;
    const project=([x,y]:Point):Point=>[width/2+(x-viewCentre[0])*zoom,height/2+(y-viewCentre[1])*zoom];
    if(dirty){
     canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
     const key=`${width}:${height}:${dpr}:${bright}`;
     if(layers.key!==key){
     ground.width=roads.width=canvas.width;ground.height=roads.height=canvas.height;
     for(const [layer,isRoads] of [[ground,false],[roads,true]] as const){const c=layer.getContext('2d')!;c.setTransform(dpr,0,0,dpr,0,0);c.translate(width/2,height/2);c.scale(zoom,zoom);c.translate(-viewCentre[0],-viewCentre[1]);drawBase(c,bright,isRoads);}
     layers.key=key;
     }
     dirty=false;
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.drawImage(ground,0,0,width,height);
    ctx.save();ctx.translate(width/2,height/2);ctx.scale(zoom,zoom);ctx.translate(-viewCentre[0],-viewCentre[1]);ctx.clip(fieldMask,'evenodd');if(visible)drawField(ctx,resistance,bright,zoom);ctx.restore();
    ctx.drawImage(roads,0,0,width,height);
    ctx.save();ctx.translate(width/2,height/2);ctx.scale(zoom,zoom);ctx.translate(-viewCentre[0],-viewCentre[1]);
    const time=animated?now/1000:0;for(const g of growths)drawGrowth(ctx,g,time);ctx.restore();
    const p=mapPalettes[bright?'day':'night'];
    ctx.font='500 11px system-ui';ctx.textAlign='center';ctx.fillStyle=p.label;
    for(const [label,position] of [['KALEVANRINNE',[-250,-410]],['VIINIKKA',[-790,410]],['NEKALA',[190,640]],['Iidesjärvi',[610,520]]] as [string,Point][]){ctx.globalAlpha=.72;ctx.fillText(label,...project(position));}
    ctx.globalAlpha=1;
    for(const g of growths){
     const visited=g.palette==='cooldown',signal=visited?'#8cf0c9':pigments[g.palette].rim;
     const [x,y]=project(g.center);ctx.fillStyle=bright?'#fff6e9':'#20392fe8';ctx.strokeStyle=signal;ctx.lineWidth=1.3;
     ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=visited?(bright?'#286947':'#8cf0c9'):(bright?'#8f451c':pigments[g.palette].light);ctx.font='700 12px system-ui';ctx.textBaseline='middle';ctx.fillText(visited?'✓':'Ⅰ',x,y);ctx.textBaseline='alphabetic';
    }
    const lab=project(labPosition);ctx.save();ctx.translate(...lab);drawSurveyStation(ctx,collected,time,bright);ctx.restore();
    ctx.font='650 12px system-ui';ctx.fillStyle=bright?'#294c45':'#d4e5d8';ctx.shadowColor=bright?'#eeeee2':'#253b40';ctx.shadowBlur=5;ctx.fillText('Field Lab',lab[0],lab[1]+47);ctx.shadowBlur=0;
    ctx.fillStyle=bright?'#48695c':'#a4c2b1';ctx.font='10px system-ui';ctx.fillText(collected?'Sample collected · scanner quiet':animated?'Sample ready · scanner active':'Sample ready · motion paused',lab[0],lab[1]+64);
    // Distance reference is deliberately fixed; slider values are illustrative offers.
    if(visible){const centre=project(fieldCentre);ctx.fillStyle=`hsl(${hue} 35% ${bright?33:76}%)`;ctx.font='10px system-ui';ctx.fillText(`Resistance · ${Math.round(resistance*100)}%`,centre[0],centre[1]+26);}
    last=now;
   }
   if(animated)frame=requestAnimationFrame(draw);
  };
  const restart=()=>{cancelAnimationFrame(frame);last=-Infinity;frame=requestAnimationFrame(draw);};
  const resize=new ResizeObserver(()=>{dirty=true;restart();});resize.observe(canvas);
  const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;if(inView)restart();else cancelAnimationFrame(frame);});observer.observe(canvas);
  media.addEventListener('change',restart);document.addEventListener('visibilitychange',restart);
  return()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();media.removeEventListener('change',restart);document.removeEventListener('visibilitychange',restart);};
 },[bright,motion,resistance,visible,collected]);
 return <div className="exploration-scene">
  <div className="exploration-scene__heading"><div><span>TAMPERE · IIDESJÄRVI / VIINIKKA</span><strong>Familiar ground. A new destination.</strong></div><span className="exploration-scene__personal">Player {player}’s map</span></div>
  <canvas ref={ref} role="img" aria-label={`Tampere map with organic outbreaks, ${visible?Math.round(resistance*100)+'% personal resistance':'resistance hidden'}, and a ${collected?'depleted, collected':'luminous, available'} survey-station Field Lab`}/>
  <div className="exploration-scene__legend"><span><i className="scene-key scene-key--outbreak"/>Outbreaks</span><span><i className="scene-key scene-key--visited"/>Visited this outing</span><span><i className="scene-key scene-key--resistance" style={{background:`hsl(${hue} 48% 55% / .28)`,borderColor:`hsl(${(hue+55)%360} 42% 65% / .6)`}}/>Your resistance</span><span><i className={'scene-key scene-key--lab'+(collected?' scene-key--empty':'')}/>{collected?'Collected by you':'Field Lab available'}</span><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></div>
 </div>;
}
