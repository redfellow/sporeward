import {AlphaType,ClipOp,ColorType,PaintStyle,Skia,StrokeJoin,TileMode,type SkImage,type SkPath} from '@shopify/react-native-skia';
import {materialPixels,type MaterialSources,type Palette,type PixelSource} from '@sporeward/rendering';
import type {WorldView} from '@sporeward/protocol';
import {Directory,File,Paths} from 'expo-file-system';
export type Outbreak=WorldView['outbreaks'][number];
export type GrowthRaster={key:string;id:string;url:string;coordinates:[[number,number],[number,number],[number,number],[number,number]]};
const directory=new Directory(Paths.cache,'growth-material-v1');
let cacheReady=false;
function pixels(image:SkImage):PixelSource{
 const width=image.width(),height=image.height(),data=image.readPixels(0,0,{width,height,colorType:ColorType.RGBA_8888,alphaType:AlphaType.Unpremul});
 if(!(data instanceof Uint8Array))throw new Error('Unable to read growth material.');
 return {width,height,data};
}
export function prepareMaterial(texture:SkImage):MaterialSources{
 const blur=(sigma:number)=>{
  const surface=Skia.Surface.Make(texture.width(),texture.height());if(!surface)throw new Error('Material surface unavailable.');
  const paint=Skia.Paint(),filter=Skia.ImageFilter.MakeBlur(sigma,sigma,TileMode.Clamp);paint.setImageFilter(filter);surface.getCanvas().drawImage(texture,0,0,paint);
  const image=surface.makeImageSnapshot(),result=pixels(image);image.dispose();paint.dispose();filter.dispose();surface.dispose();return result;
 };
 return {detail:pixels(texture),body:blur(34),relief:blur(8)};
}
function hash(s:string){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function rasterPalette(o:Outbreak,now:number):Palette{return o.status==='cleared'||o.eligibleAt>now?'cooldown':o.status==='clearing'?'clearing':o.visitsRemaining>5?'crimson':'amber';}
export function rasterKey(o:Outbreak,now:number){return `${o.id}:${rasterPalette(o,now)}:${hash(JSON.stringify(o.ring))}`;}
/** Rasterize the exact contact polygon. Material and every stroke are in metres.
 * The 24 m padding contains the decorative halo; it never changes GPS contacts. */
export function renderGrowth(o:Outbreak,sources:MaterialSources,now:number):GrowthRaster{
 const key=rasterKey(o,now),origin:[number,number]=[23.795,61.495],mx=111320*Math.cos(origin[1]*Math.PI/180),my=111320;
 const points=o.ring.map(([lon,lat])=>[(lon-origin[0])*mx,(origin[1]-lat)*my]);
 const west=Math.min(...points.map(p=>p[0]))-24,north=Math.min(...points.map(p=>p[1]))-24;
 const width=Math.max(...points.map(p=>p[0]))+24-west,height=Math.max(...points.map(p=>p[1]))+24-north;
 const resolution=Math.max(1.1,width/640,height/640),w=Math.ceil(width/resolution),h=Math.ceil(height/resolution);
 const surface=Skia.Surface.Make(w,h);if(!surface)throw new Error('Growth surface unavailable.');
 const canvas=surface.getCanvas(),builder=Skia.PathBuilder.Make(),paint=Skia.Paint();canvas.clear(Skia.Color('transparent'));paint.setAntiAlias(true);paint.setColor(Skia.Color('white'));
 points.forEach(([x,y],i)=>i?builder.lineTo(x,y):builder.moveTo(x,y));builder.close();const path=builder.detach();builder.dispose();
 canvas.scale(1/resolution,1/resolution);canvas.translate(-west,-north);canvas.drawPath(path,paint);
 const maskImage=surface.makeImageSnapshot(),mask=pixels(maskImage);maskImage.dispose();
 // Keep texture phase stable while the shape changes by anchoring it to its identity.
 const palette=rasterPalette(o,now),seed=hash(o.id)%10000;
 const data=materialPixels(mask,sources,seed,palette,west,north,resolution);
 const imageData=Skia.Data.fromBytes(new Uint8Array(data.buffer));
 const image=Skia.Image.MakeImage({width:w,height:h,colorType:ColorType.RGBA_8888,alphaType:AlphaType.Unpremul},imageData,w*4);
 if(!image){paint.dispose();path.dispose();surface.dispose();imageData.dispose();throw new Error('Growth pixels unavailable.');}
 canvas.clear(Skia.Color('transparent'));
 const colour=palette==='amber'?'255,137,10':palette==='crimson'?'255,45,79':palette==='cooldown'?'170,188,181':'159,226,245';
 const stroke=(p:SkPath,width:number,alpha:number,rgb=colour)=>{paint.setStyle(PaintStyle.Stroke);paint.setStrokeJoin(StrokeJoin.Round);paint.setStrokeWidth(width);paint.setColor(Skia.Color(`rgba(${rgb},${alpha})`));canvas.drawPath(p,paint);};
 canvas.save();canvas.translate(3,5);for(const [width,alpha] of [[25,.045],[19,.065],[13,.10],[7,.14]])stroke(path,width,alpha);canvas.restore();
 for(const [width,alpha] of [[19,.045],[12,.075],[7,.12],[3.8,.20]])stroke(path,width,alpha);
 canvas.save();canvas.clipPath(path,ClipOp.Intersect,true);paint.setStyle(PaintStyle.Fill);paint.setColor(Skia.Color('white'));canvas.drawImageRect(image,Skia.XYWHRect(0,0,w,h),Skia.XYWHRect(west,north,w*resolution,h*resolution),paint);
 const rim=palette==='amber'?'255,157,16':palette==='crimson'?'255,90,103':palette==='cooldown'?'205,222,214':'212,245,255';
 for(const [width,alpha] of [[18,.12],[8,.18],[3,.38]])stroke(path,width,alpha,rim);
 stroke(path,1.7,.65,palette==='amber'?'255,213,112':palette==='crimson'?'255,124,131':'214,255,239');canvas.restore();
 const output=surface.makeImageSnapshot();
 // A process killed by Android cannot run hook cleanup. Drop its disposable files once.
 if(!cacheReady){if(directory.exists)directory.delete();directory.create({idempotent:true,intermediates:true});cacheReady=true;}
 const file=new File(directory,hash(key)+'.png');file.write(output.encodeToBytes());
 output.dispose();image.dispose();imageData.dispose();paint.dispose();path.dispose();surface.dispose();
 const coordinate=(x:number,y:number):[number,number]=>[origin[0]+x/mx,origin[1]-y/my];
 return {key,id:o.id,url:file.uri,coordinates:[coordinate(west,north),coordinate(west+w*resolution,north),coordinate(west+w*resolution,north+h*resolution),coordinate(west,north+h*resolution)]};
}
export function removeRaster(r:GrowthRaster){try{new File(r.url).delete();}catch{}}
