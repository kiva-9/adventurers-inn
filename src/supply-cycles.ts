/** Deterministic recurring town appeals for the open-ended continuation. */
export interface SupplyTerms {cycle:number;openDay:number;deadline:number;foodCost:number;herbCost:number}
export type SavedSupplyTerms = Partial<SupplyTerms>;
/** A new appeal may open at 08:00 every 15 days, beginning on day 45. */
export function recurringSupplyFor(day:number,minute:number):SupplyTerms|null {
 if(!Number.isSafeInteger(day)||day<45||minute<480)return null;
 const cycle=1+Math.floor((day-45)/15),openDay=45+(cycle-1)*15,deadline=openDay+3;
 if(day>deadline)return null;
 return {cycle,openDay,deadline,foodCost:6+2*(cycle%3),herbCost:2+(cycle%3)};
}
/** Missing fields describe the original day 12–15 appeal, for old saves. */
export function supplyTerms(saved?:SavedSupplyTerms):SupplyTerms {
 return {cycle:saved?.cycle??0,openDay:saved?.openDay??12,deadline:saved?.deadline??15,foodCost:saved?.foodCost??8,herbCost:saved?.herbCost??3};
}
