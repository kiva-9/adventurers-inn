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
