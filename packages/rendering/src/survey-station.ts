/** Accepted desktop survey station, shared verbatim with native rendering. */
export interface StationGradient { addColorStop(offset:number,colour:string):void }
export interface SurveyStationCanvas {
 lineCap:string;lineJoin:string;fillStyle:unknown;strokeStyle:unknown;lineWidth:number;globalAlpha:number;shadowColor:string;shadowBlur:number;
 save():void;restore():void;beginPath():void;moveTo(x:number,y:number):void;lineTo(x:number,y:number):void;
 ellipse(x:number,y:number,rx:number,ry:number,rotation:number,start:number,end:number):void;
 arc(x:number,y:number,r:number,start:number,end:number):void;roundRect(x:number,y:number,w:number,h:number,r:number):void;
 fill():void;stroke():void;fillRect(x:number,y:number,w:number,h:number):void;rotate(angle:number):void;
 createLinearGradient(x1:number,y1:number,x2:number,y2:number):StationGradient;
 createRadialGradient(x1:number,y1:number,r1:number,x2:number,y2:number,r2:number):StationGradient;
}
export const RESISTANCE_HUE=227;
export function drawSurveyStation(ctx:SurveyStationCanvas,collected:boolean,time:number,bright:boolean){
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // A physical installation: grounded feet, a glass chamber and a separate scanner.
 ctx.fillStyle=bright?'#193d3438':'#071b2490';ctx.beginPath();ctx.ellipse(7,23,34,13,-.15,0,Math.PI*2);ctx.fill();
 if(!collected){
  const glow=ctx.createRadialGradient(0,-4,3,0,-4,61);
  glow.addColorStop(0,'#73ebd33b');glow.addColorStop(.45,'#62d9d01b');glow.addColorStop(1,'#62d9d000');
  ctx.fillStyle=glow;ctx.fillRect(-62,-66,124,124);
  ctx.strokeStyle=bright?'#398e88':'#8ae6d9';ctx.lineWidth=1;
  for(let i=0;i<2;i++){
   const phase=(time/4+i*.5)%1;
   ctx.globalAlpha=(1-phase)*.42;ctx.beginPath();ctx.ellipse(0,12,33+phase*23,18+phase*12,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.globalAlpha=.7;ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,12,38,21,0,-Math.PI*.15+time*.35,Math.PI*.55+time*.35);ctx.stroke();ctx.globalAlpha=1;
 }
 const leg=(x:number,y:number,bendX:number,bendY:number)=>{
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(bendX,bendY);ctx.lineTo(x,y);ctx.strokeStyle='#112d33';ctx.lineWidth=7;ctx.stroke();
  ctx.strokeStyle=collected?'#718784':'#9dbdb5';ctx.lineWidth=3.4;ctx.stroke();
  ctx.strokeStyle=collected?'#9aa5a0':'#deece1';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle=collected?'#4e635f':'#698880';ctx.beginPath();ctx.ellipse(x,y,5.5,2.7,0,0,Math.PI*2);ctx.fill();
 };
 leg(0,-25,0,-13);leg(-25,24,-13,9);leg(collected?33:25,collected?19:24,collected?21:13,collected?16:9);
 ctx.save();if(collected)ctx.rotate(.09);
 ctx.fillStyle=collected?'#435955':'#466e68';ctx.strokeStyle=collected?'#849b91':'#c0e3d2';ctx.lineWidth=1.6;
 ctx.beginPath();ctx.ellipse(0,0,12,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle=collected?'#213b3d':'#1e4a48';ctx.beginPath();ctx.roundRect(-9,-25,18,26,5);ctx.fill();ctx.stroke();
 const glass=ctx.createLinearGradient(-7,-21,8,-1);
 glass.addColorStop(0,collected?'#99b4b12c':'#c3fff2a0');glass.addColorStop(.4,collected?'#64837c18':'#52dcbcbb');glass.addColorStop(1,collected?'#3c514e20':'#25998c80');
 ctx.fillStyle=glass;ctx.beginPath();ctx.roundRect(-6.5,-21,13,20,3);ctx.fill();
 if(!collected){
  ctx.fillStyle='#b9ffee';ctx.shadowColor='#55f7ce';ctx.shadowBlur=10;ctx.beginPath();ctx.ellipse(0,-8+Math.sin(time*1.6)*1.2,3,5.5,.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.strokeStyle='#e7fff5a0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-4,-19);ctx.lineTo(-4,-5);ctx.stroke();
 }else{
  ctx.strokeStyle='#869e924a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-4,-18);ctx.lineTo(-4,-6);ctx.stroke();
  ctx.fillStyle='#5a7770';ctx.beginPath();ctx.ellipse(0,-1,5,1.5,0,0,Math.PI*2);ctx.fill();
 }
 ctx.fillStyle=collected?'#60776d':'#8fb4a0';ctx.strokeStyle=collected?'#95a99c':'#d5eedc';ctx.beginPath();ctx.ellipse(0,-25,10,4,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
 if(collected){
  ctx.fillStyle=bright?'#d5e5d7':'#1e3d36';ctx.strokeStyle='#9ac9ad';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(24,-19,8,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle=bright?'#47745a':'#b7dec2';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(20,-19);ctx.lineTo(23,-16);ctx.lineTo(28,-22);ctx.stroke();
 }
 ctx.restore();
}
