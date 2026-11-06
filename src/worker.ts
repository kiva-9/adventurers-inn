import {advance, command, createWorld, validateWorld, worldRunning} from './engine';
import {repairPlayerPosition} from './save-migration';
import type {World, WorkerRequest, WorkerResponse} from './types';
let world:World|undefined;
const send=(requestId?:number,accepted?:boolean)=>{if(world)self.postMessage({type:'snapshot',world,requestId,accepted} satisfies WorkerResponse)};
self.onmessage=(event:MessageEvent<WorkerRequest>)=>{const m=event.data;try{let accepted:boolean|undefined;if(m.type==='new')world=createWorld(m.seed);else if(m.type==='load'){if(!validateWorld(m.world))throw new Error('存档损坏或版本不受支持。');world=structuredClone(m.world);world.continued??=false;repairPlayerPosition(world);world.paused=true}else if(m.type==='command'){if(!world)throw new Error('请先开始游戏。');accepted=command(world,m.command)}send(m.type==='command'?m.requestId:undefined,accepted)}catch(e){self.postMessage({type:'error',message:e instanceof Error?e.message:'世界更新失败',requestId:m.type==='command'?m.requestId:undefined} satisfies WorkerResponse)}};
let updates=0;setInterval(()=>{if(world&&!world.paused&&worldRunning(world)){advance(world,world.speed);updates++;if(updates%3===0||!worldRunning(world))send()}},100);
