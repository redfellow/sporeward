import type {Footprint,Point} from './footprint';
import {materialPixels,type Palette} from '@sporeward/rendering';
export type {Palette} from '@sporeward/rendering';
export function outline(rings:Point[][]):Path2D {
 const path=new Path2D();
 for(const ring of rings){ring.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));path.closePath();}
 return path;
}
const sourceCache=new WeakMap<HTMLImageElement,{detail:ImageData;body:ImageData;relief:ImageData}>();
function sourcePixels(image:HTMLImageElement){
 let pixels=sourceCache.get(image);
 if(!pixels){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const detail=ctx.getImageData(0,0,canvas.width,canvas.height);ctx.filter='blur(34px)';ctx.drawImage(image,-40,-40,canvas.width+80,canvas.height+80);const body=ctx.getImageData(0,0,canvas.width,canvas.height);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.filter='blur(8px)';ctx.drawImage(image,0,0);const relief=ctx.getImageData(0,0,canvas.width,canvas.height);pixels={detail,body,relief};sourceCache.set(image,pixels);}
 return pixels;
}
/** All material coordinates, edge thicknesses and texture density are fixed in geographic metres. */
export function createMaterial(footprint:Footprint,palette:Palette,texture:HTMLImageElement,style:'membrane'|'wet'='membrane'){
 const points=footprint.rings.flat();
 const west=Math.min(...points.map(p=>p[0]))-8,north=Math.min(...points.map(p=>p[1]))-8,east=Math.max(...points.map(p=>p[0]))+8,south=Math.max(...points.map(p=>p[1]))+8;
 const resolution=1.1,w=Math.ceil((east-west)/resolution),h=Math.ceil((south-north)/resolution),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d')!,path=outline(footprint.rings);
 ctx.save();ctx.scale(1/resolution,1/resolution);ctx.translate(-west,-north);ctx.fill(path,'evenodd');ctx.restore();
 const mask=ctx.getImageData(0,0,w,h),pixels=ctx.createImageData(w,h);
 pixels.data.set(materialPixels(mask,sourcePixels(texture),footprint.seed,palette,west,north,resolution,style));
 ctx.putImageData(pixels,0,0);
 return {canvas,west,north,width:w*resolution,height:h*resolution,path};
}
