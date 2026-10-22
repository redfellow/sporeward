export type Point=[number,number];
const R=6378137,C=Math.cos(61.495*Math.PI/180),ORIGIN:Point=[23.795,61.495],Y0=Math.log(Math.tan(Math.PI/4+ORIGIN[1]*Math.PI/360));
export const growthMetresPerRadian=R*C;
export function growthPoint([lon,lat]:Point):Point{
 'worklet';return [(lon-ORIGIN[0])*Math.PI/180*R*C,(Y0-Math.log(Math.tan(Math.PI/4+Math.max(-85,Math.min(85,lat))*Math.PI/360)))*R*C];
}
export function growthCoordinate([x,y]:Point):Point{return [ORIGIN[0]+x/(R*C)*180/Math.PI,(2*Math.atan(Math.exp(Y0-y/(R*C)))-Math.PI/2)*180/Math.PI];}
