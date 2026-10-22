import {RESISTANCE_HUE} from './survey-station';
export const resistanceHazeStops=[[0,.65],[.34,.48],[.7,.25],[.9,.1],[1,0]] as const;
export function resistanceContour(radius:number,band:number):[number,number][]{
 const r=radius*(.18+band*.156);
 return Array.from({length:100},(_,i)=>{
  const a=i/100*Math.PI*2,rr=r*(1+.035*Math.sin(a*3+.7)+.025*Math.cos(a*5+band*.15));
  return [Math.cos(a)*rr,Math.sin(a)*rr];
 });
}
export const resistanceTint=(bright:boolean,alpha:number)=>`hsla(${RESISTANCE_HUE},${bright?55:48}%,${bright?35:55}%,${alpha})`;
export const resistanceContourColour=(bright:boolean,alpha=1)=>`hsla(${(RESISTANCE_HUE+55)%360},42%,${bright?43:83}%,${alpha})`;
