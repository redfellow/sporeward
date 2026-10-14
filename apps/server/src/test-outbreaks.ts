import type {Coordinate} from '@sporeward/protocol';
export type TestOutbreak={id:string;name:string;ring:Coordinate[];accessWay:number};
const locations=[
 {id:'hatanpaa',name:'Hatanpää',position:[23.7619996,61.4839089],accessWay:1395823937,cells:[[0,0],[1,0],[-1,0],[0,1],[1,1]]},
 {id:'pyynikki',name:'Pyynikki',position:[23.7273125,61.5003719],accessWay:362855212,cells:[[0,0],[-1,0],[1,0],[0,-1],[0,-2]]},
 {id:'tammerkoski',name:'Tammerkoski',position:[23.7638238,61.5019885],accessWay:23360065,cells:[[0,0],[-1,0],[1,0],[0,-1],[1,-1]]},
 {id:'kauppi',name:'Kauppi',position:[23.810108,61.5102042],accessWay:866014201,cells:[[0,0],[1,0],[0,1],[-1,1],[-1,2]]},
 {id:'kaleva',name:'Kaleva',position:[23.8013183,61.4978981],accessWay:120553071,cells:[[0,0],[1,0],[-1,0],[-1,-1],[0,1]]}
];
/** Five level-17 cells with their shared edges removed, then rounded twice.
 * The central cell contains a checked public OSM cycleway/path point.
 */
export function tampereTestOutbreaks():TestOutbreak[] {
 const n=2**17;
 return locations.map(location=>{
  const [lon,lat]=location.position;
  const x=Math.floor((lon+180)/360*n),r=lat*Math.PI/180;
  const y=Math.floor((1-Math.asinh(Math.tan(r))/Math.PI)/2*n);
  const edges=new Map<string,[Coordinate,Coordinate]>();
  const key=(a:Coordinate)=>a.join(',');
  for(const [dx,dy] of location.cells) {
   const corners:Coordinate[]=[[x+dx,y+dy],[x+dx+1,y+dy],[x+dx+1,y+dy+1],[x+dx,y+dy+1]];
   corners.forEach((a,i)=>{const b=corners[(i+1)%4],reverse=key(b)+'>'+key(a);if(edges.has(reverse))edges.delete(reverse);else edges.set(key(a)+'>'+key(b),[a,b]);});
  }
  const chain=new Map([...edges.values()].map(([a,b])=>[key(a),b]));
  const first=[...edges.values()][0][0];let cursor=first,ring:Coordinate[]=[];
  do {ring.push(cursor);cursor=chain.get(key(cursor))!;}while(key(cursor)!==key(first));
  for(let iteration=0;iteration<2;iteration++)ring=ring.flatMap((a,i)=>{const b=ring[(i+1)%ring.length];return [[a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]] as Coordinate[];});
  ring=ring.map(([x,y])=>[x/n*360-180,Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI]);
  return {id:location.id,name:location.name,ring,accessWay:location.accessWay};
 });
}
