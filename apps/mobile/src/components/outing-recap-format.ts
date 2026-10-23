export function formatFieldLabRecap(actualFraction:number,resistanceReduction:number){
 const percent=Math.round(actualFraction*100);
 return {
  restoration:percent===0&&actualFraction>0?'<1% restoration':`${percent}% restoration`,
  explanation:resistanceReduction>0
   ?'Reduced resistance may mean less resistance-based point loss on later eligible visits to familiar areas.'
   :'No resistance was restored in this collection.'
 };
}
