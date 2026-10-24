import {routeGeometry,type Fix} from '../recording/model';

/** Find real recording gaps before reducing points for a small static preview. */
export function thumbnailRoute(fixes:Fix[]){
 const route=routeGeometry(fixes),stride=Math.max(1,Math.ceil(fixes.length/1500));
 return {...route,lines:{...route.lines,features:route.lines.features.map(feature=>({...feature,geometry:{...feature.geometry,coordinates:feature.geometry.coordinates.filter((_,index,points)=>index===0||index===points.length-1||index%stride===0)}}))}};
}
