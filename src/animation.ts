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

/** A point in scene-local tile coordinates. These helpers are visual-only. */
export interface VisualPoint { x:number; y:number }
const equal=(a:VisualPoint,b:VisualPoint)=>a.x===b.x&&a.y===b.y;
const manhattan=(a:VisualPoint,b:VisualPoint)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const MAX_SNAPSHOT_STEPS=24;

/** Recover the exact observed segment from the previous authoritative route.
 * A long wait, a changed route, or a teleport cannot be inferred safely. */
export function observedSteps(from:VisualPoint,to:VisualPoint,previousRoute?:readonly VisualPoint[]):VisualPoint[]|null {
 if(equal(from,to))return [];
 if(previousRoute){
  const end=previousRoute.findIndex(p=>equal(p,to));
  if(end>=0&&end<MAX_SNAPSHOT_STEPS){
   const steps=previousRoute.slice(0,end+1);let last=from;
   for(const p of steps){if(manhattan(last,p)!==1)return null;last=p;}
   return steps;
  }
 }
 return manhattan(from,to)===1?[to]:null;
}
export type VisualPlan={kind:'snap'|'unchanged'|'animate';points:VisualPoint[]};
/** Reset invisible/changed-scene actors even if old and new targets coincide.
 * Otherwise append newly observed route steps to any unfinished visual segment. */
export function planVisualMovement(options:{visible:boolean;current:VisualPoint;previousTarget:VisualPoint;target:VisualPoint;remaining:readonly VisualPoint[];previousRoute?:readonly VisualPoint[]}):VisualPlan {
 const {visible,current,previousTarget,target,remaining,previousRoute}=options;
 if(!visible)return {kind:'snap',points:[target]};
 if(equal(previousTarget,target))return {kind:'unchanged',points:[]};
 const observed=observedSteps(previousTarget,target,previousRoute);
 if(!observed||remaining.length+observed.length>MAX_SNAPSHOT_STEPS*2)return {kind:'snap',points:[target]};
 const points:VisualPoint[]=[current];
 for(const p of [...remaining,...observed])if(!equal(points[points.length-1],p))points.push(p);
 return points.length>1?{kind:'animate',points}:{kind:'snap',points:[target]};
}
/** Sample the actual cardinal polyline by distance rather than cutting corners. */
export function sampleVisualPath(points:readonly VisualPoint[],progress:number):{x:number;y:number;segment:number;dx:number;dy:number} {
 if(points.length<2){const p=points[0]??{x:0,y:0};return {x:p.x,y:p.y,segment:0,dx:0,dy:0};}
 let total=0;
 for(let i=0;i<points.length-1;i++)total+=manhattan(points[i],points[i+1]);
 let remaining=Math.max(0,Math.min(1,progress))*total;
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],length=manhattan(a,b);
  if(remaining<=length||i===points.length-2){const fraction=length?Math.min(1,remaining/length):1;return {x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction,segment:i,dx:b.x-a.x,dy:b.y-a.y};}
  remaining-=length;
 }
 const end=points[points.length-1];return {x:end.x,y:end.y,segment:points.length-2,dx:0,dy:0};
}
