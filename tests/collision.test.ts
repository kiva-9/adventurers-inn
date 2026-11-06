import { describe, expect, it } from 'vitest';
import { isSceneBlocked } from '../src/collision';
import { findPath } from '../src/pathfinding';
import type { Place } from '../src/types';

const spawns: Record<Place, {x:number;y:number}> = {
  inn:{x:5,y:5},guild:{x:13,y:3},market:{x:20,y:4},clinic:{x:22,y:10},square:{x:14,y:9},gate:{x:27,y:9},
};
describe('scene collision',()=>{
  it('blocks map edges, inn bar and tables while leaving passages and doors open',()=>{
    const blocked=(x:number,y:number)=>isSceneBlocked('inn',x,y,3);
    expect(blocked(0,4)).toBe(true); expect(blocked(30,4)).toBe(true);
    expect(blocked(8,0)).toBe(true); expect(blocked(8,16)).toBe(true);
    expect(blocked(5,4)).toBe(true); expect(blocked(13,7)).toBe(true);
    expect(blocked(5,5)).toBe(false); expect(blocked(15,15)).toBe(false);
  });
  it('tracks the renderer bed and adjacent chest coordinates as capacity increases',()=>{
    expect(isSceneBlocked('inn',3,11,0)).toBe(false);
    expect(isSceneBlocked('inn',3,11,1)).toBe(true);
    expect(isSceneBlocked('inn',4,11,1)).toBe(true);
    expect(isSceneBlocked('inn',7,11,1)).toBe(false);
    expect(isSceneBlocked('inn',7,11,2)).toBe(true);
    expect(isSceneBlocked('inn',3,13,7)).toBe(false);
    expect(isSceneBlocked('inn',3,13,8)).toBe(true);
    expect(isSceneBlocked('inn',27,13,14)).toBe(true);
  });
  it('blocks large facade footprints and representative furniture',()=>{
    expect(isSceneBlocked('market',13,3,3)).toBe(true);
    expect(isSceneBlocked('market',15,5,3)).toBe(true);
    expect(isSceneBlocked('market',20,5,3)).toBe(true);
    expect(isSceneBlocked('guild',10,4,3)).toBe(true);
    expect(isSceneBlocked('clinic',25,6,3)).toBe(true);
    expect(isSceneBlocked('gate',16,4,3)).toBe(true);
  });
  it('keeps each destination and starting player position open and connected',()=>{
    for(const place of Object.keys(spawns) as Place[]) {
      for(const beds of [3,5,14]) {
        const block=(x:number,y:number)=>isSceneBlocked(place,x,y,beds);
        const start=spawns[place];
        expect(block(start.x,start.y), `${place} spawn`).toBe(false);
        expect(findPath(start,{x:15,y:15},block),`${place} door`).not.toBeNull();
      }
    }
    expect(isSceneBlocked('inn',5,7,3)).toBe(false);
  });
  it('keeps every starting NPC position open',()=>{
    const startPlaces: Place[]=['inn','guild','market','clinic','square'];
    for(let i=0;i<14;i++) {
      const place=startPlaces[i%5], spawn=spawns[place];
      expect(isSceneBlocked(place,spawn.x+i%3,spawn.y+i%2,3),`NPC ${i}`).toBe(false);
    }
  });
});
import {createWorld,command} from '../src/engine';
import {test} from 'vitest';
test('玩家移动在柜台前被拒绝，仍可转向离开',()=>{const w=createWorld(42);expect(command(w,{type:'move',dx:0,dy:-1})).toBe(true);expect(command(w,{type:'move',dx:0,dy:-1})).toBe(true);expect(command(w,{type:'move',dx:0,dy:-1})).toBe(false);expect(w.player).toMatchObject({x:5,y:5});expect(command(w,{type:'move',dx:1,dy:0})).toBe(true)});

import {SQUARE_DOORS,doorDestination} from '../src/scene-transitions';
it('广场五个门口均可从出生点走到并进入，各场所出口返回广场',()=>{for(const door of SQUARE_DOORS){const route=findPath({x:14,y:9},{x:door.x,y:door.y},(x,y)=>isSceneBlocked('square',x,y,3));expect(route,door.label).not.toBeNull();expect(doorDestination('square',door.x,door.y)).toBe(door.place);expect(doorDestination(door.place,15,14)).toBe('square')}expect(doorDestination('square',14,9)).toBeNull()});
import {repairPlayerPosition} from '../src/save-migration';
it('旧存档中落入新建筑的玩家迁到最近可走格；合法位置不变',()=>{const w=createWorld(1);w.player={place:'square',x:9,y:4};expect(repairPlayerPosition(w)).toBe(true);expect(isSceneBlocked(w.player.place,w.player.x,w.player.y,w.beds)).toBe(false);expect(Math.abs(w.player.x-9)+Math.abs(w.player.y-4)).toBe(2);const legal=structuredClone(w.player);expect(repairPlayerPosition(w)).toBe(false);expect(w.player).toEqual(legal)});
