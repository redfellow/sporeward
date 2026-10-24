/** Accepted Ember & violet guide data, shared by browser and native adapters. */
import {membraneMotion,membranePoints,type Membrane} from './richer';
export const guideScheme={id:'ember',name:'Ember & violet',note:'Warm difficulty ladder · unmistakable violet remnants',
 easy:{body:'#f28a20',deep:'#bd4c0d',rim:'#ffbb51',light:'#fff2b7'},
 medium:{body:'#ea6843',deep:'#a33324',rim:'#ffa082',light:'#ffe1bd'},
 hard:{body:'#df4058',deep:'#8e173b',rim:'#ff8194',light:'#ffd0da'},
 remnant:{body:'#aa7ce9',deep:'#5b388d',rim:'#dfb5ff',light:'#f5e4ff'},
 clearing:{body:'#80cdc5',deep:'#699fc4',rim:'#ccfff3',light:'#f1fff9'},signal:'#8cf0c9'};
export type GuideState='easy'|'medium'|'hard'|'visited'|'withering'|'clearing'|'remnant'|'cooldown'|'disintegrating'|'stabilizing'|'cracking';
type View={status:string;lifecycle?:string;crossings?:number;eligibleAt:number;visitsRemaining:number};
export function guideBaseState(o:View,now:number):GuideState{
 if(o.lifecycle==='stabilizing')return 'stabilizing';
 if(o.eligibleAt>now||o.status==='cleared')return 'cooldown';
 if(o.lifecycle==='remnant')return 'remnant';
 if(o.status==='clearing')return 'clearing';
 if(o.lifecycle==='disintegrating')return 'disintegrating';
 if((o.crossings??0)>=3)return 'cracking';
 if(o.status==='withering')return 'withering';
 return o.visitsRemaining<=2?'easy':o.visitsRemaining<=5?'medium':'hard';
}
/** Contact is a personal marker layered over the outbreak's unchanged visual state. */
export function guideState(o:View,now:number,visited=false):GuideState{
 return visited?'visited':guideBaseState(o,now);
}
export function guidePigment(state:GuideState){
 if(state==='remnant')return guideScheme.remnant;
 if(state==='clearing'||state==='stabilizing')return guideScheme.clearing;
 if(state==='cooldown'||state==='visited')return {body:'#879693',deep:'#596f72',rim:'#becbc6',light:'#e7eee9'};
 if(state==='medium'||state==='cracking')return guideScheme.medium;
 if(state==='hard'||state==='disintegrating')return guideScheme.hard;
 return guideScheme.easy;
}
export const guideFractures=[[-16,-95,3,-70,-10,-48,7,-29,-9,-15,12,1,-2,16,19,28,7,48,15,67,7,96],[3,-70,25,-77,34,-91],[7,-29,31,-39,43,-35],[-2,16,-28,11,-40,20],[19,28,42,24,55,8],[15,67,36,73,47,90],[31,-39,39,-53,36,-63],[-28,11,-43,4,-53,9],[42,24,54,32,62,28],[25,-77,20,-85,24,-94],[36,73,48,66,59,69]];
export function guideMembranePoints(m:Membrane,state:GuideState){
 const points=membranePoints(m.radius,m.seed);
 if(state!=='disintegrating')return points;
 const angular:[number,number][]=[points[0]];
 for(let i=1;i<points.length;i+=Math.max(1,Math.floor(points.length/15))){const [x,y]=points[i],factor=.94+.18*Math.sin(i*2.39+m.seed)+.09*Math.cos(i*1.7-m.seed);angular.push([x*factor,y*factor]);}
 return angular;
}
export function guideMembraneMotion(m:Membrane,time:number,seed:number,state:GuideState){
 const hurting=state==='withering'||state==='disintegrating'||state==='visited',v=membraneMotion(m,hurting?0:time,seed),jitter=state==='disintegrating'?2.4:state==='withering'?1.5:0,rate=state==='withering'?5.5:10;
 return {...v,dx:v.dx+Math.sin(time*rate+m.seed)*jitter,dy:v.dy+Math.cos(time*rate*1.27+m.seed*2)*jitter};
}
/** Centred SVG badges avoid emoji/font differences on Android. */
export function guideBadgeSvg(state:GuideState|'lab'|'lab-collected',bright:boolean){
 const paths:Record<GuideState|'lab'|'lab-collected',string>={easy:'M24 17V31',medium:'M21 17V31M27 17V31',hard:'M18 17V31M24 17V31M30 17V31',
  disintegrating:'M26 15L18 25H24L22 33L30 22H25Z',remnant:'M24 16L26 22L32 24L26 26L24 32L22 26L16 24L22 22Z',
  withering:'M24 16V31M18 25L24 31L30 25',clearing:'M17 22Q20 18 24 22T31 22M17 28Q20 24 24 28T31 28',
  cracking:'M17 17L24 24L17 31M31 17L24 24L31 31',stabilizing:'M17 24H18M23 24H25M30 24H31',
  lab:'M17 31H31M24 31V25M17 17Q17 27 27 27L17 17M24 16Q31 17 32 24M25 12Q35 13 36 23',
  'lab-collected':'M17 31H31M24 31V25M17 17Q17 27 27 27L17 17M24 16Q31 17 32 24M25 12Q35 13 36 23',
  cooldown:'M24 18V24L29 27',visited:'M17 24L22 29L31 19'};
 const colour=state==='visited'?guideScheme.signal:state==='lab'||state==='lab-collected'?'#b9f7df':guidePigment(state).rim;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48"><circle cx="24" cy="24" r="15" fill="${bright?'#163c34':'#102c29'}" stroke="${colour}" stroke-width="1.8"/><path d="${paths[state]}" fill="${state==='disintegrating'?colour:'none'}" stroke="${colour}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>${state==='lab-collected'?`<circle cx="36" cy="35" r="7" fill="#173e38" stroke="${colour}" stroke-width="1.5"/><path d="M32 35L35 38L40 32" fill="none" stroke="${colour}" stroke-width="1.8"/>`:''}${state==='cooldown'?`<circle cx="24" cy="24" r="8" fill="none" stroke="${colour}" stroke-width="1.4"/>`:''}</svg>`;
}

/** Composite contact badge keeps the lifecycle glyph above a centered check. */
export function guideContactSvg(state:GuideState,bright:boolean){
 const paths:Record<GuideState,string>={easy:'M24 17V31',medium:'M21 17V31M27 17V31',hard:'M18 17V31M24 17V31M30 17V31',
  disintegrating:'M26 15L18 25H24L22 33L30 22H25Z',remnant:'M24 16L26 22L32 24L26 26L24 32L22 26L16 24L22 22Z',
  withering:'M24 16V31M18 25L24 31L30 25',clearing:'M17 22Q20 18 24 22T31 22M17 28Q20 24 24 28T31 28',
  cracking:'M17 17L24 24L17 31M31 17L24 24L31 31',stabilizing:'M17 24H18M23 24H25M30 24H31',cooldown:'M24 18V24L29 27',visited:'M17 24L22 29L31 19'};
 const pigment=guidePigment(state),signal=guideScheme.signal,background=bright?'#163c34':'#102c29',fill=state==='disintegrating'?pigment.rim:'none';
 const cooldown=state==='cooldown'?`<circle cx="24" cy="20" r="6.6" fill="none" stroke="${pigment.rim}" stroke-width="1.2"/>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="${background}" stroke="${signal}" stroke-width="2.8"/><g transform="translate(4 -4) scale(.83)"><path d="${paths[state]}" fill="${fill}" stroke="${pigment.rim}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>${cooldown}</g><path d="M17 24L22 29L31 19" fill="none" stroke="#10271f" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 24L22 29L31 19" fill="none" stroke="${signal}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/** Relative simplified-body diameter; heavy effort is the reference size. */
export function guideOverviewScale(state:GuideState){
 if(state==='easy'||state==='remnant'||state==='cooldown'||state==='visited')return .85;
 if(state==='hard'||state==='disintegrating')return 1;
 return .9;
}

/** Clearing's accepted broad native stroke bands, in 77-unit body coordinates. */
export const guideHaloStrokes=[{width:38,opacity:.09},{width:16,opacity:.18}] as const;
