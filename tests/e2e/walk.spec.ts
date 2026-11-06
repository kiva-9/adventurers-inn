import {test,expect,type Page} from '@playwright/test';
import {findPath} from '../../src/pathfinding';
import {isSceneBlocked} from '../../src/collision';
import type {Place} from '../../src/types';

declare global { interface Window { __walkPosition?:{place:Place;x:number;y:number} } }
async function walk(page:Page,place:Place,start:{x:number;y:number},end:{x:number;y:number}){
 const route=findPath(start,end,(x,y)=>isSceneBlocked(place,x,y,3));expect(route).not.toBeNull();let prev=start;
 for(const step of route!){
  const key=step.x>prev.x?'d':step.x<prev.x?'a':step.y>prev.y?'s':'w';await page.keyboard.press(key);
  await expect.poll(()=>page.evaluate(()=>window.__walkPosition),{timeout:10_000}).toEqual({place,x:step.x,y:step.y});prev=step;
 }
}
test('从旅店步行至广场，再走到旅店门口进入',async({page})=>{
 // Observe real Worker snapshots without changing commands or state; avoid wall-clock assumptions under load.
 await page.addInitScript(()=>{
  const NativeWorker=window.Worker;
  window.Worker=class extends NativeWorker {constructor(url:string|URL,options?:WorkerOptions){super(url,options);this.addEventListener('message',(event:MessageEvent)=>{if(event.data.type==='snapshot')window.__walkPosition={...event.data.world.player}});}};
 });
 await page.goto('/');await page.getByRole('button',{name:'开始新旅程'}).click();await expect(page.locator('.location-label')).toContainText('归途旅店');
 await walk(page,'inn',{x:5,y:7},{x:15,y:14});await page.keyboard.press('e');await expect(page.locator('.location-label')).toContainText('镇广场');
 await page.screenshot({path:'docs/evidence/town-square.png'});
 await walk(page,'square',{x:14,y:9},{x:4,y:6});await page.keyboard.press('e');await expect(page.locator('.location-label')).toContainText('归途旅店');
});
