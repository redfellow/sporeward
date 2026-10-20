import type {StyleSpecification,LineLayerSpecification} from '@maplibre/maplibre-react-native';
import {mapPalettes} from '@sporeward/rendering';
import liberty from '../../assets/maps/liberty.json';
type Width=NonNullable<LineLayerSpecification['paint']>['line-width'];
function thinner(width:Width,factor:number):Width{
 if(typeof width==='number')return width*factor;
 if(Array.isArray(width)&&width[0]==='interpolate')return width.map((value,i)=>i>=4&&i%2===0&&typeof value==='number'?value*factor:value) as Width;
 return width;
}
/** Preserve the provider's geometry, filters and zoom hierarchy; colour locally. */
export function gameMapStyle(bright:boolean):StyleSpecification{
 const c=mapPalettes[bright?'day':'night'];
 const original=liberty as unknown as StyleSpecification;
 return {...original,layers:original.layers.map(layer=>{
  const l={...layer},source='source-layer' in l?l['source-layer']:'',id=l.id;
  if(l.type==='background')return {...l,paint:{...l.paint,'background-color':c.ground}};
  if(l.type==='raster'||l.type==='fill-extrusion'||id==='road_area_pattern'||id==='landcover_wetland')return {...l,layout:{...l.layout,visibility:'none' as const}};
  if(l.type==='fill')return {...l,paint:{...l.paint,'fill-color':source==='water'?c.water:source==='building'?c.building:source==='park'||source==='landcover'||/cemetery|pitch/.test(id)?c.park:c.ground,...(source==='building'?{'fill-outline-color':c.building}:{}),'fill-opacity':1}};
  if(l.type==='line'){
   const road=source==='transportation',major=/motorway|trunk|primary/.test(id),path=/path|pedestrian|track/.test(id),casing=/casing/.test(id);
   return {...l,paint:{...l.paint,...(road&&l.paint?.['line-width']!==undefined?{'line-width':thinner(l.paint['line-width'],major?.65:.85)}:{}),'line-color':source==='waterway'?c.water:road?(casing?c.roadEdge:major?c.major:path?c.trail:c.road):c.roadEdge,...(source==='boundary'?{'line-opacity':.25}:{})}};
  }
  if(l.type==='symbol'){
   if(source==='poi'||/one_way|shield/.test(id))return {...l,layout:{...l.layout,visibility:'none' as const}};
   return {...l,minzoom:source==='transportation_name'?Math.max(l.minzoom??0,14):l.minzoom,paint:{...l.paint,'text-color':c.label,'text-halo-color':c.ground,'text-halo-width':1.1}};
  }
  return l;
 })};
}
