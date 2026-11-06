import { describe, it, expect } from 'vitest';
import { activityOf, nightOpacity } from '../src/animation';

describe('visual state mapping',()=>{
 it('uses actual state to distinguish injury, eating, resting and conversation',()=>{
  expect(activityOf({health:80,action:'工作或交流'})).toBe('hurt');
  expect(activityOf({health:100,action:'享用丰盛炖菜'})).toBe('eat');
  expect(activityOf({health:100,action:'赊账吃饭'})).toBe('eat');
  expect(activityOf({health:100,action:'在客房休息'})).toBe('rest');
  expect(activityOf({health:100,action:'工作或交流'})).toBe('talk');
  expect(activityOf({health:100,action:'在镇上走动'})).toBe('idle');
 });
 it('changes daylight continuously at dusk and dawn and stays bounded',()=>{
  expect(nightOpacity(5*60)).toBeCloseTo(nightOpacity(5*60-0.01),3);
  expect(nightOpacity(7*60)).toBeCloseTo(nightOpacity(7*60-0.01),3);
  expect(nightOpacity(19*60)).toBeCloseTo(nightOpacity(19*60+0.01),3);
  expect(nightOpacity(22*60)).toBeCloseTo(nightOpacity(22*60-0.01),3);
  for(let t=0;t<1440;t++)expect(nightOpacity(t)).toBeGreaterThanOrEqual(0);
  for(let t=0;t<1440;t++)expect(nightOpacity(t)).toBeLessThanOrEqual(.27);
 });
});

import { observedSteps, planVisualMovement, sampleVisualPath } from '../src/animation';

describe('snapshot interpolation',()=>{
 it('resets immediately on scene change even when the authoritative target matches',()=>{
  const plan=planVisualMovement({visible:false,current:{x:4.6,y:5},previousTarget:{x:5,y:5},target:{x:5,y:5},remaining:[{x:5,y:5}]});
  expect(plan).toEqual({kind:'snap',points:[{x:5,y:5}]});
 });
 it('preserves a 12-step observed 4× route with turns instead of teleporting',()=>{
  const start={x:1,y:1};const path=[{x:2,y:1},{x:3,y:1},{x:4,y:1},{x:5,y:1},{x:6,y:1},{x:7,y:1},{x:7,y:2},{x:7,y:3},{x:7,y:4},{x:7,y:5},{x:7,y:6},{x:7,y:7}];
  const plan=planVisualMovement({visible:true,current:start,previousTarget:start,target:path.at(-1)!,remaining:[],previousRoute:path});
  expect(plan.kind).toBe('animate');expect(plan.points).toEqual([start,...path]);
  const corner=sampleVisualPath(plan.points,.5);expect(corner.x).toBe(7);expect(corner.y).toBe(1);
  const after=sampleVisualPath(plan.points,.75);expect(after.x).toBe(7);expect(after.y).toBe(4);
  expect(sampleVisualPath(plan.points,1)).toMatchObject({x:7,y:7});
 });
 it('continues a still-in-progress segment without a backward jump',()=>{
  const plan=planVisualMovement({visible:true,current:{x:1.8,y:1},previousTarget:{x:3,y:1},target:{x:5,y:1},remaining:[{x:2,y:1},{x:3,y:1}],previousRoute:[{x:4,y:1},{x:5,y:1}]});
  expect(plan.kind).toBe('animate');expect(plan.points).toEqual([{x:1.8,y:1},{x:2,y:1},{x:3,y:1},{x:4,y:1},{x:5,y:1}]);
  expect(sampleVisualPath(plan.points,0)).toMatchObject({x:1.8,y:1});
 });
 it('does not invent paths through unknown or malformed movement',()=>{
  expect(observedSteps({x:1,y:1},{x:4,y:1},undefined)).toBeNull();
  expect(observedSteps({x:1,y:1},{x:3,y:1},[{x:3,y:1}])).toBeNull();
  expect(observedSteps({x:1,y:1},{x:2,y:1},undefined)).toEqual([{x:2,y:1}]);
  expect(planVisualMovement({visible:true,current:{x:1,y:1},previousTarget:{x:1,y:1},target:{x:4,y:1},remaining:[]})).toEqual({kind:'snap',points:[{x:4,y:1}]});
 });
});
