export type TesterScores={updatedAt:number;entries:{rank:number;playerId:string;name:string;username:string;points:number}[]};
export function parseTesterScores(value:unknown):TesterScores{
 const s=value as TesterScores;
 if(!s||!Number.isFinite(s.updatedAt)||s.updatedAt<=0||!Array.isArray(s.entries)||s.entries.length>50)throw new Error('Invalid tester scores.');
 const ids=new Set<string>();
 for(const [i,e] of s.entries.entries()){
  if(!e||e.rank!==i+1||typeof e.playerId!=='string'||!e.playerId||e.playerId.length>100||ids.has(e.playerId)||typeof e.name!=='string'||!e.name||e.name.length>80||typeof e.username!=='string'||e.username.length>40||!Number.isFinite(e.points)||e.points<0)throw new Error('Invalid tester score entry.');ids.add(e.playerId);
 }
 return s;
}
