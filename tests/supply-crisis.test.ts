import { describe, expect, it } from 'vitest';
import { advance, command, createWorld, validateWorld } from '../src/engine';
import type { World } from '../src/types';

function ready():World {
  const w=createWorld(90210);
  // This is a controlled setup for the one-off decision; full runs are in validate:sim.
  w.day=12; w.minute=479;
  advance(w,1);
  expect(w.supplyCrisis?.status).toBe('开放');
  return w;
}
describe('小镇供给危机',()=>{
  it('one real choice transfers supplies and creates a witnessed, non-repeatable result',()=>{
    const early=createWorld(99);expect(command(early,{type:'supplyCrisis',choice:'商会'})).toBe(false);
    expect(early.supplyCrisis?.status).toBe('未开始');
    const w=ready(), food=w.food, gold=w.gold, trust=w.npc[13].trust;
    expect(command(w,{type:'supplyCrisis',choice:'商会'})).toBe(true);
    expect(w.food).toBe(food-8);expect(w.gold).toBe(gold);
    expect(w.support.商会).toBe(1);expect(w.support.守望者).toBe(0);expect(w.npc[13].trust).toBe(trust+1);
    const event=w.events.at(-1)!;
    expect(event.text).toContain('8 份食材');expect(event.people).toContain('n13');
    expect(w.npc[13].memories.at(-1)?.eventId).toBe(event.id);
    expect(command(w,{type:'supplyCrisis',choice:'商会'})).toBe(false);
    expect(w.food).toBe(food-8);expect(w.support.商会).toBe(1);
  });
  it('offers a distinct medicine route and rejects insufficient resources without settlement',()=>{
    const w=ready(), food=w.food;
    w.herbs=2; const before=structuredClone(w);
    expect(command(w,{type:'supplyCrisis',choice:'守望者'})).toBe(false);
    expect(w.herbs).toBe(before.herbs);expect(w.support).toEqual(before.support);
    expect(w.supplyCrisis?.status).toBe('开放');
    command(w,{type:'travel',place:'market'});
    expect(command(w,{type:'buy',item:'herbs',amount:3})).toBe(true);
    expect(command(w,{type:'supplyCrisis',choice:'守望者'})).toBe(true);
    expect(w.herbs).toBe(2);expect(w.food).toBe(food);
    expect(w.support.守望者).toBe(1);expect(w.support.商会).toBe(0);expect(w.npc[8].trust).toBe(before.npc[8].trust+1);
  });
  it('retaining resources and default expiration do not give support',()=>{
    const w=ready(), food=w.food, herbs=w.herbs;
    expect(command(w,{type:'supplyCrisis',choice:'保留'})).toBe(true);
    expect(w.food).toBe(food);expect(w.herbs).toBe(herbs);expect(w.support).toEqual({商会:0,守望者:0});
    const other=ready();other.day=15;other.minute=1439;advance(other,1);
    expect(other.supplyCrisis).toEqual({status:'已解决',choice:'保留',resolvedDay:15});
    expect(other.events.some(e=>e.kind==='供给危机'&&e.text.includes('到期'))).toBe(true);
    expect(command(other,{type:'supplyCrisis',choice:'商会'})).toBe(false);
  });
  it('interrupts a long wait once at the announcement, then progresses and expires without a response',()=>{
    const w=createWorld(88);w.day=11;w.minute=480;
    expect(command(w,{type:'waitUntil',target:'morning'})).toBe(true);
    expect(w.day).toBe(12);expect(w.minute).toBe(480);expect(w.supplyCrisis?.status).toBe('开放');
    expect(w.lastMessage).toContain('等待已中断');
    expect(command(w,{type:'waitUntil',target:'morning'})).toBe(true);
    expect(w.day).toBe(13);expect(w.minute).toBe(480);
    for(let i=0;i<3;i++)command(w,{type:'waitUntil',target:'morning'});
    expect(w.day).toBe(16);expect(w.supplyCrisis?.choice).toBe('保留');
  });
  it('persists an open and a settled choice without duplicating effects; accepts old saves',()=>{
    const w=ready();const restored=JSON.parse(JSON.stringify(w)) as World;
    expect(validateWorld(restored)).toBe(true);
    expect(command(restored,{type:'supplyCrisis',choice:'商会'})).toBe(true);
    const settled=JSON.parse(JSON.stringify(restored)) as World;
    expect(validateWorld(settled)).toBe(true);
    expect(command(settled,{type:'supplyCrisis',choice:'守望者'})).toBe(false);
    expect(settled.support).toEqual({商会:1,守望者:0});
    const legacy=createWorld(1);delete legacy.supplyCrisis;expect(validateWorld(legacy)).toBe(true);
    legacy.day=16;legacy.minute=479;advance(legacy,1);expect(legacy.supplyCrisis).toBeUndefined();
    const corrupt=structuredClone(settled);corrupt.supplyCrisis!.choice=undefined;expect(validateWorld(corrupt)).toBe(false);
    expect(validateWorld({...settled,supplyCrisis:null})).toBe(false);
  });
});
