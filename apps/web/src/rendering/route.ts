import {project,unproject} from './geography';
import {contact,type Point,type Footprint} from './footprint';
export type Fix={coordinate:Point;timestamp:number};
/** Synthetic 1 Hz outing follows a shortest path through actual OSM path/road vertices. */
export function makeRoute(roads:{kind:string;points:number[][]}[]):Fix[]{
 const key=(p:Point)=>p.map(n=>n.toFixed(3)).join(','),nodes=new Map<string,{p:Point;edges:Map<string,number>}>();
 for(const road of roads){if(/motorway|trunk|construction|proposed/.test(road.kind))continue;for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1] as Point,b=road.points[i] as Point,ka=key(a),kb=key(b),d=Math.hypot(a[0]-b[0],a[1]-b[1]);
  if(!nodes.has(ka))nodes.set(ka,{p:a,edges:new Map()});if(!nodes.has(kb))nodes.set(kb,{p:b,edges:new Map()});nodes.get(ka)!.edges.set(kb,d);nodes.get(kb)!.edges.set(ka,d);
 }}
 const nearest=(p:Point)=>[...nodes].sort((a,b)=>Math.hypot(a[1].p[0]-p[0],a[1].p[1]-p[1])-Math.hypot(b[1].p[0]-p[0],b[1].p[1]-p[1]))[0][0];
 const start=nearest([-650,240]),end=nearest([620,300]),cost=new Map([[start,0]]),previous=new Map<string,string>(),queue=new Set([start]);
 while(queue.size){const current=[...queue].reduce((a,b)=>cost.get(a)!<cost.get(b)!?a:b);queue.delete(current);if(current===end)break;for(const [next,d] of nodes.get(current)!.edges){const alt=cost.get(current)!+d;if(alt<(cost.get(next)??Infinity)){cost.set(next,alt);previous.set(next,current);queue.add(next);}}}
 if(!cost.has(end))throw new Error('Map fixture does not connect replay endpoints');
 const points:Point[]=[];let current=end;while(current!==start){points.push(nodes.get(current)!.p);current=previous.get(current)!;}points.push(nodes.get(start)!.p);points.reverse();
 const fixes:Fix[]=[];let distance=0,nextDistance=0;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);while(nextDistance<=distance+length){const t=length?(nextDistance-distance)/length:0;fixes.push({coordinate:unproject([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]),timestamp:Date.UTC(2026,9,16,12)+fixes.length*1000});nextDistance+=1.6;}distance+=length;}
 return fixes;
}
export function routeContacts(fixes:Fix[],footprints:Footprint[]){const hits=new Map<number,number>();fixes.forEach((fix,index)=>footprints.forEach((footprint,id)=>{if(!hits.has(id)&&contact(project(fix.coordinate),footprint))hits.set(id,index);}));return hits;}
