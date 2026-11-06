import type { NPC } from './types';

/** Animation hints only; they never write back into the authoritative world. */
export type Activity='idle'|'eat'|'rest'|'hurt'|'talk';
export function activityOf(n:Pick<NPC,'health'|'action'>):Activity {
 if(n.health<100)return 'hurt';
 if(n.action.includes('休息')||n.action.includes('入住'))return 'rest';
 if(n.action.includes('吃')||n.action.includes('炖菜')||n.action.includes('用餐'))return 'eat';
 if(n.action.includes('交流')||n.action.includes('交谈'))return 'talk';
 return 'idle';
}
/** Continuous visual darkness, based only on the last simulated clock snapshot. */
export function nightOpacity(minute:number):number {
 const hour=minute/60;
 if(hour<5||hour>=22)return .27;
 if(hour<7)return .27*(7-hour)/2;
 if(hour<19)return 0;
 return .27*(hour-19)/3;
}
