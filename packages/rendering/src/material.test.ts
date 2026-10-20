import {describe,it,expect} from 'vitest';
import {materialPixels,type PixelSource} from './material';
describe('shared native/browser wet material',()=>{
 it('retains transparent windows, dense pools and texture contrast inside the contact mask',()=>{
  const width=160,height=120,mask:PixelSource={width,height,data:new Uint8Array(width*height*4)};
  const data=mask.data as Uint8Array;
  for(let y=8;y<height-8;y++)for(let x=8;x<width-8;x++)data[(y*width+x)*4+3]=255;
  const texture=(coarse:boolean):PixelSource=>{
   const data=new Uint8Array(width*height*4);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,value=coarse?20+x/width*210:60+155*(.5+.5*Math.sin(x/6)*Math.cos(y/7));
    data[i]=value;data[i+1]=value*.7;data[i+2]=value*.25;data[i+3]=255;
   }
   return {width,height,data};
  };
  const detail=texture(false),body=texture(true),sources={detail,body,relief:detail};
  const amber=materialPixels(mask,sources,73,'amber',-220,-220,3);
  const alpha:number[]=[],red:number[]=[];
  for(let i=0;i<amber.length;i+=4){if(!data[i+3])expect(amber[i+3]).toBe(0);else{alpha.push(amber[i+3]);red.push(amber[i]);}}
  expect(Math.max(...alpha)-Math.min(...alpha)).toBeGreaterThan(130);
  expect(Math.max(...red)-Math.min(...red)).toBeGreaterThan(50);
  expect(materialPixels(mask,sources,73,'amber',-220,-220,3)).toEqual(amber);
 });
});
