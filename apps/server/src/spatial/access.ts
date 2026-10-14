import type {Coordinate} from '@sporeward/protocol';
export type Cell={x:number;y:number};
export type Bounds={west:number;south:number;east:number;north:number};
export type AccessWay={id:number;tags:Record<string,string>;geometry:{lon:number;lat:number}[]};
export type AccessMap={version:1;bounds:Bounds;source:string;license:string;attribution:string;snapshot:string;ways:AccessWay[]};
export type AccessibleCell=Cell&{ways:number[]};
const N=2**17;
export const cellKey=(c:Cell)=>`${c.x},${c.y}`;
export function tilePosition([lon,lat]:Coordinate):Coordinate{return [(lon+180)/360*N,(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*N];}
export function tileCoordinate([x,y]:Coordinate):Coordinate{return [x/N*360-180,Math.atan(Math.sinh(Math.PI*(1-2*y/N)))*180/Math.PI];}
export function neighbours(c:Cell):Cell[]{return [{x:c.x-1,y:c.y},{x:c.x+1,y:c.y},{x:c.x,y:c.y-1},{x:c.x,y:c.y+1}];}
export function publicAccess(way:AccessWay){
 const t=way.tags;
 if(!/^(cycleway|footway|path|pedestrian|living_street|residential|unclassified|tertiary|secondary|primary|service|track|steps)$/.test(t.highway??''))return false;
 if(['private','no','customers','delivery','destination'].includes(t.access??'')||t.construction||t.proposed||t.highway==='steps')return false;
 return !['no','private'].includes(t.foot??'')||!['no','private'].includes(t.bicycle??'');
}
function bounded(c:Cell,b:Bounds){const [west,north]=tileCoordinate([c.x,c.y]),[east,south]=tileCoordinate([c.x+1,c.y+1]);return west>=b.west&&east<=b.east&&south>=b.south&&north<=b.north;}
/** Rasterize public ways by exact grid-line crossings, not sparse node sampling. */
export function accessCells(map:AccessMap):AccessibleCell[]{
 const cells=new Map<string,AccessibleCell>();
 for(const way of map.ways.filter(publicAccess))for(let i=1;i<way.geometry.length;i++){
  const a=tilePosition([way.geometry[i-1].lon,way.geometry[i-1].lat]),b=tilePosition([way.geometry[i].lon,way.geometry[i].lat]);
  const cuts=[0,1];
  for(let axis=0;axis<2;axis++)if(a[axis]!==b[axis])for(let line=Math.floor(Math.min(a[axis],b[axis]))+1;line<Math.max(a[axis],b[axis]);line++)cuts.push((line-a[axis])/(b[axis]-a[axis]));
  cuts.sort((a,b)=>a-b);
  for(let j=1;j<cuts.length;j++){
   const t=(cuts[j-1]+cuts[j])/2,c={x:Math.floor(a[0]+(b[0]-a[0])*t),y:Math.floor(a[1]+(b[1]-a[1])*t)};
   if(!bounded(c,map.bounds))continue;
   const key=cellKey(c),saved=cells.get(key)??{...c,ways:[]};if(!saved.ways.includes(way.id))saved.ways.push(way.id);cells.set(key,saved);
  }
 }
 return [...cells.values()].sort((a,b)=>a.x-b.x||a.y-b.y).map(c=>({...c,ways:c.ways.sort((a,b)=>a-b)}));
}
/** Remove shared edges and soften corners. Seeded cell layout supplies variation. */
export function cellRing(cells:Cell[],rounds=2):Coordinate[]{
 const edges=new Map<string,[Coordinate,Coordinate]>(),key=(p:Coordinate)=>p.join(',');
 for(const c of cells){const corners:Coordinate[]=[[c.x,c.y],[c.x+1,c.y],[c.x+1,c.y+1],[c.x,c.y+1]];
  corners.forEach((a,i)=>{const b=corners[(i+1)%4],reverse=key(b)+'>'+key(a);if(edges.has(reverse))edges.delete(reverse);else edges.set(key(a)+'>'+key(b),[a,b]);});}
 if(!edges.size)throw new Error('Empty outbreak footprint.');
 const chain=new Map([...edges.values()].map(([a,b])=>[key(a),b])),first=[...edges.values()][0][0];let cursor=first,ring:Coordinate[]=[];
 do{ring.push(cursor);const next=chain.get(key(cursor));if(!next||ring.length>edges.size)throw new Error('Invalid connected outbreak cells.');cursor=next;}while(key(cursor)!==key(first));
 if(ring.length!==edges.size)throw new Error('Outbreak footprint contains holes or disconnected parts.');
 for(let n=0;n<rounds;n++)ring=ring.flatMap((a,i)=>{const b=ring[(i+1)%ring.length];return [[a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]] as Coordinate[];});
 return ring.map(tileCoordinate);
}
