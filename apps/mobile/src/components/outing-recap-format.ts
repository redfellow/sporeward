export function formatFieldLabRecap(actualFraction:number,resistanceReduction:number){
 const percent=Math.round(actualFraction*100);
 return {
  restoration:percent===0&&actualFraction>0?'<1% restoration':`${percent}% restoration`,
  explanation:resistanceReduction>0
   ?'Confirmed restoration may lessen resistance-based point loss on later eligible ordinary visits near familiar areas. No exact future point amount is promised; subsequent contributions, elapsed time and reward rounding affect future points.'
   :'No resistance was restored in this collection.'
 };
}
