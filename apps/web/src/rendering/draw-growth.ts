import type {Footprint,Point} from './footprint';
import {cellCorners} from './geography';
import {outline,type Palette,createMaterial} from './material';
export type RenderGrowth={footprint:Footprint;palette:Palette;material:ReturnType<typeof createMaterial>|null};
/** Shared by the live map and the repeatable raster scale audit. All widths are metres. */
export function drawGrowth(ctx:CanvasRenderingContext2D,growth:RenderGrowth,options:{grid?:boolean;boundary?:boolean;water?:Point[][][]}={}){
 const {material:m,palette}=growth;if(!m)return;
 // Layered vector strokes approximate a soft shadow/glow in geographic metres.
 // Canvas shadowBlur is deliberately avoided because it stays in screen pixels.
 const colour=palette==='amber'?'255,137,10':palette==='crimson'?'255,45,79':'159,226,245';
 ctx.save();
 if(options.water?.length){const land=new Path2D();land.rect(m.west-40,m.north-40,m.width+80,m.height+80);land.addPath(outline(options.water.flat()));ctx.clip(land,'evenodd');}
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.save();ctx.translate(3,5);
 for(const [width,alpha] of [[25,.045],[19,.065],[13,.10],[7,.14]]){ctx.strokeStyle=`rgba(${colour},${alpha})`;ctx.lineWidth=width;ctx.stroke(m.path);}
 ctx.restore();
 for(const [width,alpha] of [[19,.045],[12,.075],[7,.12],[3.8,.20]]){ctx.strokeStyle=`rgba(${colour},${alpha})`;ctx.lineWidth=width;ctx.stroke(m.path);}
 ctx.restore();
 ctx.save();ctx.clip(m.path,'evenodd');
 ctx.drawImage(m.canvas,m.west,m.north,m.width,m.height);
 for(const [width,alpha] of [[18,.12],[8,.18],[3,.38]]){
  ctx.strokeStyle=palette==='amber'?`rgba(255,157,16,${alpha})`:palette==='crimson'?`rgba(255,90,103,${alpha})`:`rgba(212,245,255,${alpha})`;
  ctx.lineWidth=width;ctx.stroke(m.path);
 }
 ctx.strokeStyle=palette==='amber'?'rgba(255,213,112,.65)':palette==='crimson'?'rgba(255,124,131,.65)':'rgba(214,255,239,.65)';ctx.lineWidth=1.7;ctx.stroke(m.path);
 if(options.boundary){ctx.strokeStyle='#f42db6';ctx.lineWidth=1.8;ctx.stroke(m.path);}
 ctx.restore();
 if(options.grid){ctx.save();ctx.strokeStyle='#12332c88';ctx.lineWidth=.8;ctx.setLineDash([4,4]);for(const cell of growth.footprint.cells)ctx.stroke(outline([cellCorners(cell)]));ctx.restore();}
}
export type ScaleAudit={pass:boolean;maxDifferenceMetres:number;outwardMetres:number;samples:number};
/** Renders the actual material/rim pipeline at two zooms and measures its alpha bounds.
 * This detects an accidental fixed-pixel shadow/glow, not just a changed geometry constant. */
export function auditScale(growths:RenderGrowth[]):ScaleAudit{
 let maxDifferenceMetres=0,outwardMetres=0,samples=0,pass=true;
 for(const growth of growths){
  if(!growth.material)continue;
  const p=growth.footprint.rings.flat();
  const geometry=[Math.min(...p.map(p=>p[0])),Math.max(...p.map(p=>p[0])),Math.min(...p.map(p=>p[1])),Math.max(...p.map(p=>p[1]))];
  const results:number[][]=[];
  for(const zoom of [.4,.8]){
   const scale=zoom*2,padding=Math.ceil(22*scale)+4,canvas=document.createElement('canvas');
   canvas.width=Math.ceil((geometry[1]-geometry[0])*scale)+padding*2;canvas.height=Math.ceil((geometry[3]-geometry[2])*scale)+padding*2;
   const ctx=canvas.getContext('2d')!;ctx.translate(padding,padding);ctx.scale(scale,scale);ctx.translate(-geometry[0],-geometry[2]);drawGrowth(ctx,growth);
   const data=ctx.getImageData(0,0,canvas.width,canvas.height).data,bounds=[Infinity,-Infinity,Infinity,-Infinity];
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    if(data[(y*canvas.width+x)*4+3]<24)continue;
    const wx=(x+.5-padding)/scale+geometry[0],wy=(y+.5-padding)/scale+geometry[2];
    bounds[0]=Math.min(bounds[0],wx);bounds[1]=Math.max(bounds[1],wx);bounds[2]=Math.min(bounds[2],wy);bounds[3]=Math.max(bounds[3],wy);
   }
   pass&&=bounds.every(Number.isFinite);results.push(bounds);samples++;
   outwardMetres=Math.max(outwardMetres,geometry[0]-bounds[0],bounds[1]-geometry[1],geometry[2]-bounds[2],bounds[3]-geometry[3]);
  }
  maxDifferenceMetres=Math.max(maxDifferenceMetres,...results[0].map((v,i)=>Math.abs(v-results[1][i])));
 }
 // At 0.4 zoom a physical pixel is 1.25 m. The deliberate halo/shadow may
 // reach 22 m, but its geographic extent must stay stable across zooms.
 return {pass:pass&&samples>0&&maxDifferenceMetres<=2.5&&outwardMetres<=22,maxDifferenceMetres,outwardMetres,samples};
}
