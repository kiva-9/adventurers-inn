import { describe, expect, it } from 'vitest';
import { MovementController } from '../src/movement';

describe('movement input pacing',()=>{
 it('ignores OS repeat, waits for acknowledgement and visible arrival, and stops after release',()=>{
  const moves:{dir:readonly number[];id:number}[]=[];
  const c=new MovementController((dir,id)=>moves.push({dir,id}),()=>{});
  c.press('d',[1,0],false);c.tick(0,true);expect(moves).toHaveLength(1);
  for(let i=0;i<20;i++)c.press('d',[1,0],true);
  c.tick(500,true);expect(moves).toHaveLength(1);
  c.acknowledge(moves[0].id,true);c.tick(500,false);expect(moves).toHaveLength(1);
  c.tick(500,true);expect(moves).toHaveLength(2);
  c.release('d');c.acknowledge(moves[1].id,true);c.tick(1000,true);expect(moves).toHaveLength(2);
 });
 it('coalesces rapid taps, gives the latest direction priority, and never bypasses the interval',()=>{
  const moves:{dir:readonly number[];id:number}[]=[];const c=new MovementController((dir,id)=>moves.push({dir,id}),()=>{});
  c.press('d',[1,0],false);c.release('d');c.tick(0,true);c.acknowledge(moves[0].id,true);
  c.press('d',[1,0],false);c.release('d');c.press('w',[0,-1],false);c.release('w');
  c.tick(100,true);expect(moves).toHaveLength(1);c.tick(180,true);expect(moves[1].dir).toEqual([0,-1]);
 });
 it('suppresses repeated blocked input until release, while allowing a different direction',()=>{
  const moves:{dir:readonly number[];id:number}[]=[];const c=new MovementController((dir,id)=>moves.push({dir,id}),()=>{});
  c.press('d',[1,0],false);c.tick(0,true);c.acknowledge(moves[0].id,false);c.tick(200,true);expect(moves).toHaveLength(1);
  c.press('s',[0,1],false);c.tick(200,true);expect(moves[1].dir).toEqual([0,1]);
  c.acknowledge(moves[1].id,true);c.release('s');c.release('d');c.press('d',[1,0],false);c.tick(400,true);expect(moves).toHaveLength(3);
 });
 it('defers interaction until the outstanding step and visible interpolation finish',()=>{
  const moves:number[]=[];let interactions=0;const c=new MovementController((_dir,id)=>moves.push(id),()=>interactions++);
  c.press('d',[1,0],false);c.tick(0,true);c.requestInteraction();c.tick(200,true);expect(interactions).toBe(0);
  c.acknowledge(moves[0],true);c.tick(300,false);expect(interactions).toBe(0);c.tick(400,true);expect(interactions).toBe(1);
 });
 it('ignores acknowledgements from previous worlds',()=>{
  const moves:number[]=[];const c=new MovementController((_dir,id)=>moves.push(id),()=>{});
  c.press('d',[1,0],false);c.tick(0,true);c.reset();c.press('a',[-1,0],false);c.tick(1,true);
  c.acknowledge(moves[0],true);c.tick(500,true);expect(moves).toHaveLength(2);
  c.acknowledge(moves[1],true);c.tick(500,true);expect(moves).toHaveLength(3);
 });
});

it('preserves a just-tapped step before a following interaction',()=>{
 const moves:number[]=[];let interactions=0;const c=new MovementController((_d,id)=>moves.push(id),()=>interactions++);
 c.press('w',[0,-1],false);c.release('w');c.requestInteraction();c.tick(0,true);expect(moves).toHaveLength(1);expect(interactions).toBe(0);
 c.acknowledge(moves[0],true);c.tick(200,false);expect(interactions).toBe(0);c.tick(300,true);expect(interactions).toBe(1);
});
