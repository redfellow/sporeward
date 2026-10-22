import type {Point} from './footprint';
export const ORIGIN:Point=[23.795,61.495];
const LAT_METRES=111320,LON_METRES=LAT_METRES*Math.cos(ORIGIN[1]*Math.PI/180);
/** Local tangent-plane metres for this small Tampere prototype, coordinates [lon,lat]. */
export const project=([lon,lat]:Point):Point=>[(lon-ORIGIN[0])*LON_METRES,(ORIGIN[1]-lat)*LAT_METRES];
export const unproject=([x,y]:Point):Point=>[ORIGIN[0]+x/LON_METRES,ORIGIN[1]-y/LAT_METRES];
export function tileCell([x,y]:Point):Point{const [lon,lat]=unproject([x,y]);return [Math.floor((lon+180)/360*131072),Math.floor((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*131072)];}
export function cellCorners([x,y]:Point):Point[]{return [[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(([a,b])=>project([a/131072*360-180,Math.atan(Math.sinh(Math.PI*(1-2*b/131072)))*180/Math.PI]));}
