import { describe, expect, it } from 'vitest';
import { findPath } from '../src/pathfinding';

describe('小镇寻路', () => {
  it('绕开障碍并只沿四邻接移动', () => {
    const route=findPath({x:0,y:0},{x:2,y:0},(x,y)=>x===1&&y===0,3,3);
    expect(route).not.toBeNull();
    expect(route?.at(-1)).toEqual({x:2,y:0});
    let previous={x:0,y:0};
    for(const step of route!) {
      expect(Math.abs(step.x-previous.x)+Math.abs(step.y-previous.y)).toBe(1);
      expect(step).not.toEqual({x:1,y:0}); previous=step;
    }
  });
  it('不可达、边界外与被封锁的目标返回 null', () => {
    expect(findPath({x:0,y:0},{x:2,y:2},(x)=>x===1,3,3)).toBeNull();
    expect(findPath({x:0,y:0},{x:3,y:2},()=>false,3,3)).toBeNull();
    expect(findPath({x:0,y:0},{x:2,y:2},(x,y)=>x===2&&y===2,3,3)).toBeNull();
  });
});
