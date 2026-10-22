export type Palette='amber'|'crimson'|'clearing'|'cooldown';
export type PixelSource={width:number;height:number;data:ArrayLike<number>};
export type MaterialSources={detail:PixelSource;body:PixelSource;relief:PixelSource};
function edgeDistances(mask:PixelSource){
 const {width:w,height:h,data}=mask,d=new Float32Array(w*h),diagonal=Math.SQRT2;
 for(let i=0;i<d.length;i++)d[i]=data[i*4+3]>127?1e6:0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;if(!d[i])continue;
  d[i]=Math.min(d[i],x?d[i-1]+1:0,y?d[i-w]+1:0,x&&y?d[i-w-1]+diagonal:1e6,x<w-1&&y?d[i-w+1]+diagonal:1e6);
 }
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){
  const i=y*w+x;if(!d[i])continue;
  d[i]=Math.min(d[i],x<w-1?d[i+1]+1:0,y<h-1?d[i+w]+1:0,x<w-1&&y<h-1?d[i+w+1]+diagonal:1e6,x&&y<h-1?d[i+w-1]+diagonal:1e6);
 }
 return d;
}
/** Mirror repeat prevents a hard seam even if a generated tile's opposite edges differ. */
function mirror(t:number){const q=((t%2)+2)%2;return q<1?q:2-q;}
/** Shared accepted wet material. All distances and texture density are metres. */
export function materialPixels(mask:PixelSource,sources:MaterialSources,seed:number,palette:Palette,west:number,north:number,resolution:number,style:'membrane'|'wet'='wet'){
 const w=mask.width,h=mask.height,distances=edgeDistances(mask),pixels={data:new Uint8ClampedArray(w*h*4)},source=sources.detail,coarse=sources.body;
 const size=440,angle=(seed%29)*.19,cos=Math.cos(angle),sin=Math.sin(angle);
 const rim=palette==='amber'?[255,183,41]:palette==='crimson'?[255,77,104]:[197,249,237];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;if(!mask.data[i+3])continue;
  const mx=west+x*resolution,my=north+y*resolution;
  const tx=mirror((mx*cos-my*sin)/size+seed*.127),ty=mirror((mx*sin+my*cos)/size+seed*.061);
  const ix=Math.min(source.width-1,Math.floor(tx*source.width)),iy=Math.min(source.height-1,Math.floor(ty*source.height)),j=(iy*source.width+ix)*4;
  const r=source.data[j],g=source.data[j+1],b=source.data[j+2],luma=(r*.3+g*.59+b*.11)/255;
  const mass=(coarse.data[j]*.3+coarse.data[j+1]*.59+coarse.data[j+2]*.11)/255;
  const distance=distances[y*w+x]*resolution,body=1-Math.exp(-distance/28);
  const concentration=Math.min(1,Math.max(0,(.66-mass)*2.5))*body;
  const vein=Math.min(.88,Math.max(0,luma-mass-.015)*5.5)*(style==='wet'?.5:1);
  let gloss=0;
  if(style==='wet'){
   const relief=sources.relief;
   const height=(xx:number,yy:number)=>{const k=(Math.max(0,Math.min(relief.height-1,yy))*relief.width+Math.max(0,Math.min(relief.width-1,xx)))*4;return (relief.data[k]*.3+relief.data[k+1]*.59+relief.data[k+2]*.11)/255;};
   const dx=(height(ix+3,iy)-height(ix-3,iy))*3,dy=(height(ix,iy+3)-height(ix,iy-3))*3;
   const length=Math.hypot(dx,dy,.65),halfLight=(-(dx*cos+dy*sin)*.27-(-dx*sin+dy*cos)*.36+.65*.893)/length;
   gloss=Math.pow(Math.max(0,halfLight),36)*.7;
  }
  const patch=.5+.5*Math.sin(mx/61+Math.sin(my/83+angle)*1.8);
  const clearingFilm=[159*(1-patch)+118*patch,139*(1-patch)+213*patch,216*(1-patch)+190*patch];
  const clearingDeep=[94*(1-patch)+48*patch,74*(1-patch)+137*patch,155*(1-patch)+151*patch];
  const film=palette==='amber'?[255,140,10]:palette==='crimson'?[206,27,49]:clearingFilm;
  const deep=palette==='amber'?[160,60,8]:palette==='crimson'?[93,10,35]:clearingDeep;
  const light=palette==='amber'?[255,232,148]:palette==='crimson'?[255,116,133]:[214,255,241];
  // Some pooled regions contain luminous gel; others retain deep liquid colour.
  // Pigment/light varies independently of opacity, keeping thin-film windows intact.
  const lightField=.5+.5*Math.sin(mx/83+Math.sin(my/97+angle)*1.9+seed*.37);
  const lightSelection=Math.max(0,Math.min(1,(lightField-.36)/.43));
  const poolLight=lightSelection*lightSelection*(3-2*lightSelection)*Math.max(0,Math.min(1,(.68-mass)/.38))*.52;
  const luminous=palette==='amber'?[255,169,19]:palette==='crimson'?[251,48,79]:[166,246,223];
  const lip=Math.exp(-distance/5.2)*.45;
  const innerFold=Math.exp(-(((distance-13)/3.7)**2))*(.10+mass*.18);
  for(let c=0;c<3;c++){
   const pooled=film[c]*(1-concentration*.76)+deep[c]*concentration*.76;
   const detail=palette==='clearing' ? (clearingFilm[c]*.65+light[c]*luma*.35) : palette==='crimson' ? [r*.9,g*.13,b*.4+12][c] : c===0?r:c===1?g:b;
   const pigment=pooled*(style==='wet'?.28:.64)+detail*(style==='wet'?.72:.36);
   // A low-strength additive light layer keeps the original channel contrast.
   // Replacing dark pixels with flat bright colour would erase the wet relief.
   const textured=pigment+luminous[c]*poolLight*.46;
   const sheen=Math.min(.95,vein+innerFold+gloss);
   const colour=textured*(1-sheen)+(style==='wet'?255*.55+light[c]*.45:light[c])*sheen;
   const final=colour*(1-lip)+rim[c]*lip;
   pixels.data[i+c]=palette==='cooldown' ? (final*.22+(r*.3+g*.59+b*.11)*.78)*.85+22 : final;
  }
  // The map shows through broad film sheets; the concentrated material is denser.
  // Broad, visibly different thin-film windows and almost opaque pools.
  // The density comes from smooth material structure, not per-pixel speckle.
  const rawDensity=Math.max(0,Math.min(1,(.76-mass)/.40));
  const density=rawDensity*rawDensity*(3-2*rawDensity);
  const core=palette==='clearing'?.10+Math.pow(density,1.4)*.68:.12+Math.pow(density,1.35)*.85;
  const opacity=Math.min(.98,core*(.64+.36*body)+vein*.10+gloss*.14+lip*.24);
  pixels.data[i+3]=mask.data[i+3]*opacity;
 }
 return pixels.data;
}
