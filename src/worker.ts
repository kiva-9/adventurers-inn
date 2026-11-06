import {advance, command, createWorld, validateWorld} from './engine';
import {repairPlayerPosition} from './save-migration';
import type {World, WorkerRequest, WorkerResponse} from './types';
let world:World|undefined;
const send=()=>{if(world)self.postMessage({type:'snapshot',world} satisfies WorkerResponse)};
self.onmessage=(event:MessageEvent<WorkerRequest>)=>{try{const m=event.data;if(m.type==='new')world=createWorld(m.seed);else if(m.type==='load'){if(!validateWorld(m.world))throw new Error('存档损坏或版本不受支持。');world=structuredClone(m.world);repairPlayerPosition(world);world.paused=true}else if(m.type==='command'){if(!world)throw new Error('请先开始游戏。');command(world,m.command)}send()}catch(e){self.postMessage({type:'error',message:e instanceof Error?e.message:'世界更新失败'} satisfies WorkerResponse)}};
let updates=0;setInterval(()=>{if(world&&!world.paused&&world.chapter==='进行中'){advance(world,world.speed);updates++;if(updates%3===0||world.chapter!=='进行中')send()}},100);
