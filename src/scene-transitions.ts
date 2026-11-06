import type { Place } from './types';
/** Door interaction cells are scene-local. The town square connects the five destinations. */
export const SQUARE_DOORS: ReadonlyArray<{place:Exclude<Place,'square'>;x:number;y:number;label:string;building:number}> = [
 {place:'inn',x:4,y:6,label:'旅店',building:0}, {place:'guild',x:9,y:6,label:'公会',building:1},
 {place:'market',x:14,y:6,label:'市场',building:2}, {place:'clinic',x:19,y:6,label:'诊所',building:3},
 {place:'gate',x:24,y:6,label:'镇门',building:5},
];
export function doorDestination(place:Place,x:number,y:number):Place|null {
 if(place==='square')return SQUARE_DOORS.find(d=>Math.abs(d.x-x)+Math.abs(d.y-y)<=1)?.place??null;
 return Math.abs(x-15)+Math.abs(y-15)<=1?'square':null;
}
