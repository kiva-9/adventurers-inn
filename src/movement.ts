/** Input-side pacing: one acknowledged world step at a time, no unbounded key-repeat queue. */
export type Direction = readonly [number,number];
type MoveIntent={key:string;direction:Direction};
export class MovementController {
 private held=new Map<string,Direction>();
 private queued:MoveIntent|null=null;
 private pendingInteraction=false;
 private outstanding:{id:number;key:string}|null=null;
 private blocked=new Set<string>();
 private nextId=0;
 private earliest=0;
 constructor(private readonly issue:(direction:Direction,id:number)=>void,private readonly interact:()=>void,private readonly intervalMs=180){}
 press(key:string,direction:Direction,repeat:boolean){
  if(repeat||this.held.has(key))return;
  this.held.set(key,direction);this.blocked.delete(key);this.queued={key,direction};
 }
 release(key:string){this.held.delete(key);this.blocked.delete(key);}
 requestInteraction(){this.held.clear();this.blocked.clear();this.pendingInteraction=true;}
 /** Cancel user intent without pretending an already-sent worker request has completed. */
 cancel(){this.held.clear();this.queued=null;this.blocked.clear();this.pendingInteraction=false;}
 /** Invalidate the previous world, but retain monotonic IDs so late acknowledgements cannot match. */
 reset(){this.cancel();this.outstanding=null;this.earliest=0;}
 acknowledge(id:number|undefined,accepted:boolean){
  if(id===undefined||this.outstanding?.id!==id)return;
  if(!accepted){this.blocked.add(this.outstanding.key);if(this.queued?.key===this.outstanding.key)this.queued=null;}
  this.outstanding=null;
 }
 tick(now:number,settled:boolean){
  if(this.outstanding||!settled)return;
  if(this.pendingInteraction&&!this.queued){this.pendingInteraction=false;this.interact();return;}
  if(now<this.earliest)return;
  const held=[...this.held.entries()].reverse().find(([key])=>!this.blocked.has(key));
  const next=this.queued&&!this.blocked.has(this.queued.key)?this.queued:held?{key:held[0],direction:held[1]}:null;
  this.queued=null;if(!next)return;
  const id=++this.nextId;this.outstanding={id,key:next.key};this.earliest=now+this.intervalMs;this.issue(next.direction,id);
 }
 get wantsFrame(){return this.pendingInteraction||!!this.queued||[...this.held.keys()].some(key=>!this.blocked.has(key));}
}
