import type {Coordinate} from '@sporeward/protocol';
import {nearbyDestinations,type NearbyContext} from './nearby-destinations';
import type {DestinationSummary} from './destination-focus';

/** Where the world snapshot came from, as reported by the world hook. */
export type OverviewSnapshotStatus={
 /** `received`: fetched for the current account, server and world. `unattributed`: legacy cache of unknown provenance. `none`: nothing yet. */
 source:'received'|'unattributed'|'none';
 receivedAt:number|null;
 refresh:'idle'|'loading'|'failed';
};
export type OverviewContext=NearbyContext&{snapshot:OverviewSnapshotStatus};
export type OverviewField='established'|'empty'|'unavailable'|'withheld'|'loading';
export type OverviewFreshness='current'|'loading'|'last-known'|'none';
export type ResistanceOverview={
 field:OverviewField;freshness:OverviewFreshness;snapshotTime:number|null;
 headline:string;/** Present for last-known data. */qualifier:string|null;
 explanation:string[];recovery:string[];spatialNote:string|null;
 area:{centre:Coordinate;radiusMetres:number}|null;
 labs:{candidates:DestinationSummary[];located:boolean;coverage:string;empty:string|null;distanceNote:string};
};

const LAB_COVERAGE='Showing Field Labs in the loaded world only.',DIRECT='Distances are straight-line to the collection area, not a route.';
const RECOVERY=['Resistance eases passively over time.','Field Labs can reduce it further, but they are optional: continuing to clean nearby outbreaks within the usual bounds is a fine way to play.'];
const timeLabel=(time:number)=>new Date(time).toLocaleTimeString();

/** Pure presentation model: derives wording and lab candidates, never a score, percentage or recovery estimate. */
export function resistanceOverview(context:OverviewContext):ResistanceOverview{
 const {snapshot}=context,attributed=snapshot.source==='received'&&!!context.world;
 const freshness:OverviewFreshness=!attributed?(snapshot.refresh==='loading'?'loading':'none'):snapshot.refresh==='failed'?'last-known':'current';
 const snapshotTime=attributed?snapshot.receivedAt:null;
 const base={freshness,snapshotTime,qualifier:null as string|null,explanation:[] as string[],recovery:[] as string[],spatialNote:null as string|null,area:null,
  labs:{candidates:[] as DestinationSummary[],located:false,coverage:LAB_COVERAGE,empty:null as string|null,distanceNote:DIRECT}};
 if(!attributed){
  const withheld=snapshot.source==='unattributed';
  return {...base,field:withheld?'withheld':freshness==='loading'?'loading':'unavailable',
   headline:withheld?'Resistance information will appear after the map refreshes for this account.':freshness==='loading'?'Loading Resistance information…':'Resistance information is unavailable.',
   labs:{...base.labs,empty:'Field Labs appear once the map has loaded for this account.'}};
 }
 const world=context.world!,resistance=world.resistance;
 const qualifier=freshness==='last-known'?`Last-known information from ${snapshotTime===null?'an earlier update':timeLabel(snapshotTime)}. The latest update could not be loaded.`:null;
 let field:OverviewField,headline:string,area=null as ResistanceOverview['area'];
 const explanation:string[]=[],recovery:string[]=[];let spatialNote:string|null=null;
 if(!resistance){
  field='unavailable';headline='Resistance information is unavailable for this world.';
 }else if(!resistance.centre||!(resistance.centreResistance>0)){
  field='empty';headline='No active personal field is established in this snapshot.';
  explanation.push('This is a snapshot of your cleaning geography, not a promise about any visit\'s points.');
 }else{
  field='established';headline='Familiar cleaning areas can yield fewer ordinary visit points.';
  area={centre:resistance.centre,radiusMetres:resistance.radiusMetres};
  explanation.push('Accepted cleaning builds personal resistance around where you clean. Ordinary visit points near those areas can be reduced; committed cleaning and cleanup bonuses keep their usual rules.');
  spatialNote='The circle summarizes your cleaning geography. Rewards vary by location rather than switching at its edge, so use each destination\'s own details for its points.';
  recovery.push(...RECOVERY);
 }
 const labs=nearbyDestinations(context,'lab'),located=labs.located;
 const rows=labs.sections.flatMap(section=>section.data).filter(row=>row.availability==='available');
 return {freshness,snapshotTime,field,headline,qualifier,explanation,recovery,spatialNote,area,
  labs:{candidates:rows,located,coverage:freshness==='last-known'?LAB_COVERAGE+' Availability is last-known.':LAB_COVERAGE,empty:rows.length?null:'No available Field Labs in the loaded world.',distanceNote:DIRECT}};
}

const METRES_PER_DEGREE=111320;
/** Map bounds [west,south,east,north] framing the received field; null for an absent or invisible field. */
export function affectedAreaBounds(overview:Pick<ResistanceOverview,'area'>):[number,number,number,number]|null{
 const area=overview.area;if(!area)return null;
 const [lon,lat]=area.centre,r=area.radiusMetres;
 if(!Number.isFinite(lon)||!Number.isFinite(lat)||!(r>0)||Math.abs(lat)>85)return null;
 const dLat=r/METRES_PER_DEGREE,dLon=r/(METRES_PER_DEGREE*Math.cos(lat*Math.PI/180));
 return [lon-dLon,lat-dLat,lon+dLon,lat+dLat];
}

/** Re-resolve a tapped candidate against the current received state; stale rows never open as collectable. */
export function resolveLabSelection(context:OverviewContext,labId:string):'open'|'unavailable'{
 return resistanceOverview(context).labs.candidates.some(row=>row.focus.id===labId)?'open':'unavailable';
}
