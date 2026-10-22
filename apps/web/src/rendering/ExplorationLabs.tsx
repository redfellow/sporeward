import {useMemo,useState} from 'react';
import {ExplorationMap} from './ExplorationMap';
import './exploration-labs.css';

const rewards=['Antiviral Booster','Rare Specimen','Counterstrain','Protocol Override','Adaptive Serum','Wildtype Extract','Resistance Breaker','Mutation Antidote','Experimental Batch','Strain Disruptor'];
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
function resistanceEffect(resistance:number,point:number){
 const influence=resistance*Math.exp(-Math.pow(point/520,2)*2.3);
 return Math.round(100*(1-.72*influence));
}

export function ExplorationLabs({bright,motion}:{bright:boolean;motion:boolean}){
 const [players,setPlayers]=useState({A:{collected:false,resistance:.66,elapsed:0,collections:0},B:{collected:false,resistance:.66,elapsed:0,collections:0}});
 const [player,setPlayer]=useState<'A'|'B'>('A');
 const [rewardIndex,setRewardIndex]=useState(0);
 const [distance,setDistance]=useState(6);
 const [outing,setOuting]=useState(false);
 const [frozenOffer,setFrozenOffer]=useState<number|null>(null);
 const [frozenDistance,setFrozenDistance]=useState<number|null>(null);
 const [resistanceVisible,setResistanceVisible]=useState(true);
 const current=players[player],resistance=current.resistance,collections=current.collections,collectedByCurrent=current.collected;
 const calculatedOffer=useMemo(()=>Math.round(Math.min(42,distance*3.5)*(1/(1+collections*.45))),[distance,collections]);
 const restoration=outing&&frozenOffer!==null?frozenOffer:calculatedOffer;
 const localPoints=resistanceEffect(resistance,0),nearPoints=resistanceEffect(resistance,310),farPoints=resistanceEffect(resistance,650);
 const updateCurrent=(update:(value:typeof current)=>typeof current)=>setPlayers(v=>({...v,[player]:update(v[player])}));
 const mutateResistance=(delta:number)=>updateCurrent(v=>({...v,resistance:clamp(v.resistance+delta)}));
 const applyCollection=(offer:number)=>updateCurrent(v=>({...v,collections:v.collections+1,resistance:clamp(v.resistance-offer/100)}));
 const reset=()=>{setPlayers({A:{collected:false,resistance:.66,elapsed:0,collections:0},B:{collected:false,resistance:.66,elapsed:0,collections:0}});setPlayer('A');setDistance(6);setOuting(false);setFrozenOffer(null);setFrozenDistance(null);setRewardIndex(0);setResistanceVisible(true);};
 const collect=()=>{if(collectedByCurrent)return;updateCurrent(v=>({...v,collected:true,collections:v.collections+1,resistance:clamp(v.resistance-restoration/100)}));};
 return <section id="field-study" className="exploration-labs" aria-label="Field Labs and Outbreak Resistance visual study">
  <header className="exploration-labs__intro"><p className="exploration-labs__eyebrow">A PERSONAL FIELD STUDY</p><h2>Field Labs &amp; Outbreak Resistance</h2><p>These controls are a visual simulation of proposed gameplay. They change no live account, score or world data.</p></header>
  <div className="exploration-labs__section">
   <div className="exploration-labs__section-heading"><div><span>01 · SHARED DESTINATIONS</span><h3>A Field Lab can be collected once by each player</h3><p>The station stays in the world for everyone. Your collected station has an empty sample chamber and a quiet scanner. It stays intact and available on the other player’s map.</p></div><div className="exploration-labs__player-toggle" role="group" aria-label="Choose demo player">{(['A','B'] as const).map(id=><button key={id} aria-pressed={player===id} onClick={()=>setPlayer(id)}>Player {id}</button>)}</div></div>
   <ExplorationMap bright={bright} motion={motion} resistance={resistance} visible={resistanceVisible} collected={collectedByCurrent} player={player}/>
   <div className="exploration-labs__collection"><div><span className="exploration-labs__kicker">CURRENT VIEW · PLAYER {player}</span><strong>{collectedByCurrent?'Already collected':'Lab available'}</strong><p>{collectedByCurrent?'This player’s lab is disabled until it expires. Switch player to inspect the shared opportunity.':'Collect the lab to preview its restoration. A player cannot collect it twice.'}</p></div><div className="exploration-labs__reward"><small>COLLECTION REWARD NAME</small><b>{rewards[rewardIndex]}</b><span>Same resistance reduction · name is flavour only</span></div><div className="exploration-labs__collection-actions"><button onClick={collect} disabled={collectedByCurrent}>{collectedByCurrent?'Collected':'Collect lab'}</button><button className="exploration-labs__quiet-button" onClick={()=>setRewardIndex(v=>(v+1)%rewards.length)}>Next reward name</button></div></div>
   <p className="exploration-labs__reward-pool"><b>Reward name pool:</b> {rewards.join(' · ')}</p>
  </div>
  <div className="exploration-labs__section">
   <div className="exploration-labs__section-heading"><div><span>02 · PERSONAL MAP EFFECT</span><h3>Outbreak Resistance fades with distance and recovers over time</h3><p>Repeated local cleaning strengthens this temporary effect. A rest weakens it, and a Field Lab reward reduces it everywhere.</p></div><button className="exploration-labs__reset" onClick={reset}>Reset study</button></div>
   <div className="exploration-labs__resistance-grid">
    <div className="exploration-labs__controls">
     <div className="exploration-labs__meter"><div><span>PLAYER {player} · ILLUSTRATIVE RESISTANCE</span><b>{Math.round(resistance*100)}%</b></div><div className="exploration-labs__meter-track"><i style={{width:`${resistance*100}%`}}/></div><small>Temporary local effect · not permanent geographic exhaustion</small></div>
     <div className="exploration-labs__control-group"><b>Repeat local cleaning</b><p>Show the zone strengthening and nearby point opportunities declining.</p><div className="exploration-labs__buttons"><button onClick={()=>mutateResistance(.12)}>Clean locally +12%</button><button onClick={()=>mutateResistance(.3)}>Several visits +30%</button></div></div>
     <div className="exploration-labs__control-group"><b>Passive recovery</b><p>Advance illustrative time to let local resistance fade.</p><div className="exploration-labs__buttons"><button onClick={()=>{updateCurrent(v=>({...v,elapsed:v.elapsed+6,resistance:clamp(v.resistance-.08)}))}}>Rest 6 hours</button><button onClick={()=>{updateCurrent(v=>({...v,elapsed:v.elapsed+24,resistance:clamp(v.resistance-.22)}))}}>Rest 24 hours</button></div><small>{current.elapsed} simulated hours elapsed</small></div>
     <div className="exploration-labs__control-group"><b>Map visibility</b><button aria-pressed={resistanceVisible} onClick={()=>setResistanceVisible(v=>!v)}>{resistanceVisible?'Hide resistance zone':'Show resistance zone'}</button><small>Map motion {motion?'on':'off'} · station scan {motion&&!collectedByCurrent?'on':'off'}</small></div>
    </div>
   </div>
   <div className="exploration-labs__comparison">
    <div className="exploration-labs__comparison-head"><div><span className="exploration-labs__kicker">ILLUSTRATIVE DISTANCE CURVE</span><h4>Nearby opportunities recover when resistance weakens</h4></div><label>Lab distance <b>{distance} km</b><input type="range" min="0" max="20" step="1" value={distance} onChange={e=>setDistance(Number(e.target.value))}/></label></div>
    <div className="exploration-labs__points"><div><small>AT CENTRE</small><b>{localPoints} pts</b><i style={{width:`${localPoints}%`}}/></div><div><small>310 M AWAY</small><b>{nearPoints} pts</b><i style={{width:`${nearPoints}%`}}/></div><div><small>650 M AWAY</small><b>{farPoints} pts</b><i style={{width:`${farPoints}%`}}/></div></div>
    <div className="exploration-labs__offer"><div><span className="exploration-labs__kicker">{outing?'OFFER LOCKED FOR THIS OUTING':'NEXT OFFER'} · {outing?(frozenDistance??distance):distance} KM FROM CENTRE</span><b>Restore {restoration}% resistance globally</b><small>The offer stays fixed during an outing. No neighbourhood is selected or restored locally.</small></div><div className="exploration-labs__offer-actions">{outing?<button onClick={()=>{setOuting(false);setFrozenOffer(null);setFrozenDistance(null);}}>End outing</button>:<button onClick={()=>{setFrozenOffer(calculatedOffer);setFrozenDistance(distance);setOuting(true);}}>Start simulated outing</button>}<button disabled={outing||resistance===0||restoration===0} onClick={()=>applyCollection(restoration)}>Preview next lab reward</button></div></div>
    <p className="exploration-labs__provisional">The map stays fixed; the slider compares hypothetical lab distances. Illustrative model only: distance grows to a 42% cap; successive collections reduce the offer. Exact centre, radius, curve, cap and recovery timing remain open for gameplay balancing.</p>
   </div>
  </div>
 </section>;
}
