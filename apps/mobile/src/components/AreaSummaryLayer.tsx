import {useMemo,useRef} from 'react';
import {GeoJSONSource,Layer,type GeoJSONSourceRef,type CircleLayerSpecification} from '@maplibre/maplibre-react-native';
import {guideOverviewScale,mapPalettes} from '@sporeward/rendering';
import type {Coordinate,WorldView} from '@sporeward/protocol';
import {outbreakMarkers} from './outbreak-geometry';
import {outbreakMarkerComposition} from './outbreak-appearance';
type SummaryData={type:'FeatureCollection';features:{type:'Feature';geometry:{type:'Point';coordinates:Coordinate};properties:Record<string,string|number>}[]};
type Expand=(center:Coordinate,zoom:number)=>void;
const clusterProperties={outbreaks:['+',['get','outbreaks']],labs:['+',['get','labs']],active:['+',['get','active']],remnants:['+',['get','remnants']],clearing:['+',['get','clearing']],unavailable:['+',['get','unavailable']],effort:['+',['get','effort']],effortCount:['+',['get','effortCount']]} as const;
/** Different native clustering radii progressively reveal destinations without JS camera following. */
export function AreaSummaryLayer({world,bright,visited,overviewZoom,onExpand}:{world:WorldView|null;bright:boolean;visited:Set<string>;overviewZoom:number;onExpand:Expand}){
 const data=useMemo(()=>({type:'FeatureCollection' as const,features:[
  ...outbreakMarkers(world).map(({outbreak:o,anchor,members})=>{
   const marker=outbreakMarkerComposition(o,world!.serverTime,visited.has(o.id)),group=marker.summaryGroup;
   return {type:'Feature' as const,geometry:{type:'Point' as const,coordinates:anchor},properties:{circleScale:guideOverviewScale(marker.lifecycle),color:marker.palette.body,icon:marker.icon,contacted:marker.contacted,contactIcon:marker.contactIcon??'',outbreaks:members.length,labs:0,effort:members.reduce((sum,m)=>sum+m.visitsRemaining,0),effortCount:members.length,active:group==='active'?1:0,remnants:group==='remnants'?1:0,clearing:group==='clearing'?1:0,unavailable:group==='unavailable'?1:0}};
  }),
  ...(world?.fieldLabs??[]).filter(l=>l.expiresAt>(world?.serverTime??0)).map(l=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:l.position},properties:{color:'#b9f7df',icon:l.collected?'badge-lab-collected':'badge-lab',outbreaks:0,labs:1,effort:0,effortCount:0,active:0,remnants:0,clearing:0,unavailable:0}})),
 ]}),[world,visited]);
 const edge=(step:number)=>Math.min(11.375,Math.max(3,overviewZoom+step-.625));
 return <>{[{id:'wide',min:0,max:edge(.25),radius:60},{id:'middle',min:edge(.25),max:edge(.75),radius:28},{id:'near',min:edge(.75),max:edge(1.25),radius:12},{id:'single',min:edge(1.25),max:14,radius:0}].map(band=><SummaryBand key={band.id+':'+band.min+':'+band.max} {...band} data={data} bright={bright} onExpand={onExpand}/>)}</>;
}
function SummaryBand({id,min,max,radius,data,bright,onExpand}:{id:string;min:number;max:number;radius:number;data:SummaryData;bright:boolean;onExpand:Expand}){
 const effortColor:NonNullable<CircleLayerSpecification['paint']>['circle-color']=['case',['>', ['get','effortCount'],0],['interpolate',['linear'],['/', ['get','effort'],['max',1,['get','effortCount']]],1,'#66513e',4,'#65473f',8,'#603d49'],bright?'#4f6b60':'#38594f'];
 const source=useRef<GeoJSONSourceRef>(null),prefix='area-'+id+'-'+min.toFixed(3)+'-'+max.toFixed(3);
 return <GeoJSONSource key={prefix} ref={source} id={prefix} data={data} cluster={radius>0} clusterRadius={Math.max(1,radius)} clusterMaxZoom={13} clusterProperties={clusterProperties} onPress={event=>{
  const f=event.nativeEvent.features[0];if(f?.geometry.type!=='Point')return;
  const center=f.geometry.coordinates as Coordinate,cluster=f.properties?.cluster_id;
  if(typeof cluster==='number')void source.current?.getClusterExpansionZoom(cluster).then(zoom=>onExpand(center,Math.max(zoom,max+.01))).catch(()=>onExpand(center,max+.1));else onExpand(center,f.properties?.labs?15:14);
  event.stopPropagation();
 }}>
  <Layer key="area-glow" id={prefix+'-area-glow'} type="circle" minzoom={min} maxzoom={max} filter={['has','point_count']} paint={{'circle-radius':(radius>=60?22:radius>=28?18:14)*2.6,'circle-color':effortColor,'circle-opacity':.24,'circle-blur':.8}}/>
  <Layer key="disc" id={prefix+'-disc'} type="circle" minzoom={min} maxzoom={max} filter={['has','point_count']} paint={{'circle-radius':radius>=60?22:radius>=28?18:14,'circle-color':effortColor,'circle-opacity':.96,'circle-stroke-color':mapPalettes[bright?'day':'night'].water,'circle-stroke-opacity':.85,'circle-stroke-width':1}}/>
  <Layer key="count" id={prefix+'-count'} type="symbol" minzoom={min} maxzoom={max} filter={['has','point_count']} layout={{'text-field':['to-string',['+',['get','outbreaks'],['get','labs']]],'text-size':12,'text-font':['Noto Sans Bold'],'text-allow-overlap':true,'text-ignore-placement':true}} paint={{'text-color':'#e0dbc9'}}/>
  <Layer key="body" id={prefix+'-body'} type="circle" minzoom={min} maxzoom={Math.min(12,max)} filter={['all',['!', ['has','point_count']],['>', ['get','outbreaks'],0]]} paint={{'circle-radius':['interpolate',['linear'],['zoom'],3,['*',12,['get','circleScale']],10,['*',16,['get','circleScale']],12,['*',22,['get','circleScale']]],'circle-color':['get','color'],'circle-opacity':.55,'circle-stroke-color':['get','color'],'circle-stroke-width':1.5}}/>
  <Layer key="badge" id={prefix+'-badge'} type="symbol" minzoom={min} maxzoom={max} filter={['!', ['has','point_count']]} layout={{'icon-image':['get','icon'],'icon-size':['interpolate',['linear'],['zoom'],3,['case',['>', ['get','labs'],0],.3,.16],10,['case',['>', ['get','labs'],0],.38,.18],12,['case',['>', ['get','labs'],0],.55,.25],14,['case',['>', ['get','labs'],0],.8,.5]],'icon-allow-overlap':true}}/>
  <Layer key="contact-check" id={prefix+'-contact-check'} type="symbol" minzoom={min} maxzoom={max} filter={['all',['!', ['has','point_count']],['>', ['get','outbreaks'],0],['==',['get','contacted'],true]]} layout={{'icon-image':['get','contactIcon'],'icon-size':['interpolate',['linear'],['zoom'],3,.16,10,.2,12,.22,14,.24],'icon-offset':[12,12],'icon-allow-overlap':true,'icon-ignore-placement':true}}/>
 </GeoJSONSource>;
}
