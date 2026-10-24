import type {GuideState} from '@sporeward/rendering';

export const guideSteps=[
 {title:'Choose a detour',text:'Look for an outbreak or Field Lab along the way. A walk, run or ride can help.'},
 {title:'Record your outing',text:'Start recording before you set off. Pause for a break, then resume when you continue.'},
 {title:'Touch an outbreak',text:'Passing through its area records contact. An eligible visit earns points and starts cleaning; riding circles adds no extra visit reward.'},
 {title:'See what changed',text:'Finish and confirm your outing. Upload happens automatically when connected; the recap shows your route, contacts and confirmed rewards.'},
];
export type GuideEntry={id:GuideState;title:string;description:string;transition?:string;preview?:boolean};
export const outbreakGuideEntries:GuideEntry[]=[
 {id:'easy',title:'Light effort',description:'Relatively few visits are needed after committed cleaning. A light outbreak is an approachable detour.',transition:'Left to grow → Medium'},
 {id:'medium',title:'Medium effort',description:'More work remains. Each eligible visit contributes, even if you do not finish it yourself.',transition:'Left to grow → Heavy'},
 {id:'hard',title:'Heavy effort',description:'The most resistant ordinary outbreaks need more visits. The warm colour tells you the effort still needed; the shape changes gradually.'},
 {id:'disintegrating',title:'Disintegrating',description:'Near the end of its life, an outbreak will break into remnants unless cleared first. You can still earn visit points and a cleanup bonus.',transition:'Breaks apart → Remnants'},
 {id:'remnant',title:'Remnants',description:'Violet fragments left after disintegration. One eligible touch clears a fragment for its share of the original cleanup bonus.',transition:'One eligible touch → Cleared'},
 {id:'withering',title:'Withering',description:'Players have started cleaning it. The dotted rim and trembling membranes show that it is shrinking; it may still need more visits.',transition:'More cleaning → Smaller'},
 {id:'clearing',title:'Clearing',description:'Committed cleaning is expected to finish it. The pale body and wider halo show that no further visit is needed, though another player may still earn the finishing bonus.',transition:'Committed cleaning → Cleared'},
 {id:'cooldown',title:'On cooldown',description:'A recent visit makes this outbreak temporarily unavailable to you. A new contact does not award another eligible visit until your cooldown ends.',transition:'Wait → Eligible again'},
 {id:'visited',title:'Visited this outing',description:'A green border and check mark your contact on this outing. They sit over the underlying outbreak state; the check records contact, not a guaranteed points award.',transition:'Green marker → Contact recorded'},
 {id:'cracking',title:'Cracks forming',description:'Visual preview: repeated crossings by several players along the same road may form a crack and lead to splitting. Strategic splitting is not active in the ordinary test world.',transition:'Repeated crossings → May split',preview:true},
 {id:'stabilizing',title:'Splitting',description:'Visual preview: the gap becomes a jagged seam as one outbreak separates. Visits pause while its boundaries settle. Strategic splitting is not active in the ordinary test world.',preview:true},
];
