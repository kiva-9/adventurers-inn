import {test,expect,type Page} from '@playwright/test';

type Trace={at:number;id:number;x:number;y:number;visualX:number;visualY:number;accepted:boolean};
declare global { interface Window { __movementTrace?:Trace[]; __movementRenderer?:any } }
async function instrument(page:Page,slow=false){
 await page.addInitScript(({slow})=>{
  if(slow){const real=requestAnimationFrame.bind(window);window.requestAnimationFrame=(callback)=>window.setTimeout(()=>real(callback),100);window.cancelAnimationFrame=(id)=>clearTimeout(id);}
  window.__movementTrace=[];
  const NativeWorker=window.Worker;
  window.Worker=class extends NativeWorker {
   constructor(url:string|URL,options?:WorkerOptions){super(url,options);this.addEventListener('message',(e:MessageEvent)=>{
    if(e.data.type!=='snapshot'||e.data.requestId===undefined)return;
    const v=window.__movementRenderer?.views?.get('__player');
    window.__movementTrace!.push({at:performance.now(),id:e.data.requestId,x:e.data.world.player.x,y:e.data.world.player.y,visualX:(v?.sprite.x??NaN)/32,visualY:(v?.sprite.y??NaN)/32,accepted:e.data.accepted});
   });}
  };
 },{slow});
 await page.goto('/');
 await page.evaluate(async()=>{const path='/src/renderer.ts';const {WorldRenderer}=await import(path);const original=WorldRenderer.prototype.mount;WorldRenderer.prototype.mount=function(host:HTMLElement){window.__movementRenderer=this;return original.call(this,host)};});
 await page.getByRole('button',{name:'开始新旅程'}).click();
 await expect(page.getByRole('button',{name:'▶ 时间已暂停 · 点击让小镇动起来'})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>!!window.__movementRenderer?.views?.get('__player'))).toBe(true);
}
async function hold(page:Page,key:string,repeats:number){await page.keyboard.down(key);for(let i=0;i<repeats;i++){await page.waitForTimeout(30);await page.keyboard.down(key)}await page.keyboard.up(key);}
async function trace(page:Page):Promise<Trace[]>{return page.evaluate(()=>window.__movementTrace??[]);}

test('长按按动画步频行走，触墙时画面已经到达，换向与快点不积压',async({page})=>{
 await instrument(page);
 await hold(page,'d',70);
 await expect.poll(async()=>(await trace(page)).some(x=>!x.accepted)).toBe(true);
 const first=await trace(page),blocked=first.find(x=>!x.accepted)!;
 expect(blocked.x).toBe(11);expect(blocked.y).toBe(7);expect(Math.abs(blocked.x-blocked.visualX)).toBeLessThanOrEqual(.05);
 expect(first.filter(x=>!x.accepted)).toHaveLength(1);
 for(const step of first.filter(x=>x.accepted))expect(Math.abs(step.x-step.visualX)+Math.abs(step.y-step.visualY)).toBeLessThanOrEqual(1.05);
 await page.waitForTimeout(400);expect(await trace(page)).toHaveLength(first.length);
 await page.keyboard.press('s');await page.waitForTimeout(260);await page.keyboard.press('d');
 await expect.poll(async()=>{const t=await trace(page);const x=t.at(-1);return `${x?.x},${x?.y}`}).toBe('12,8');
 const before=(await trace(page)).length;
 for(const key of ['a','d','a','d','a','d'])await page.keyboard.press(key);
 await page.waitForTimeout(850);const after=await trace(page);
 expect(after.length-before).toBeLessThanOrEqual(2);
 const count=after.length;await page.waitForTimeout(450);expect(await trace(page)).toHaveLength(count);
 await page.getByRole('button',{name:'▶ 时间已暂停 · 点击让小镇动起来'}).click();await expect(page.getByRole('button',{name:'Ⅱ 暂停'})).toBeVisible();
});

test('低帧率下仍等待画面到达，不累积过快步数',async({page})=>{
 await instrument(page,true);const frameDelay=await page.evaluate(()=>new Promise<number>(resolve=>requestAnimationFrame(a=>requestAnimationFrame(b=>resolve(b-a)))));expect(frameDelay).toBeGreaterThanOrEqual(80);await hold(page,'d',55);await page.waitForTimeout(650);
 const steps=(await trace(page)).filter(x=>x.accepted);
 expect(steps.length).toBeGreaterThanOrEqual(1);
 for(let i=1;i<steps.length;i++)expect(steps[i].at-steps[i-1].at).toBeGreaterThanOrEqual(150);
 for(const step of steps)expect(Math.abs(step.x-step.visualX)+Math.abs(step.y-step.visualY)).toBeLessThanOrEqual(1.05);
 const n=(await trace(page)).length;await page.waitForTimeout(500);expect(await trace(page)).toHaveLength(n);
});


test('打开面板会取消长按，关闭后不自动续走',async({page})=>{
 await instrument(page);await page.keyboard.down('d');await page.waitForTimeout(260);
 await page.getByRole('button',{name:'♜ 经营旅店'}).click();await page.waitForTimeout(350);
 const count=(await trace(page)).length;await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.keyboard.down('d');await page.waitForTimeout(450);expect(await trace(page)).toHaveLength(count);
 await page.keyboard.up('d');await page.keyboard.press('d');await expect.poll(async()=>(await trace(page)).length).toBe(count+1);
});

test('快速按方向后按 E，先走到目标再互动',async({page})=>{
 await instrument(page);await page.keyboard.press('w');await page.keyboard.press('e');
 await expect(page.getByRole('heading',{name:'艾琳',exact:true})).toBeVisible();
 const last=(await trace(page)).at(-1)!;expect(last).toMatchObject({x:5,y:6,accepted:true});
 const actual=await page.evaluate(()=>{const v=window.__movementRenderer.views.get('__player');return {x:v.sprite.x/32,y:v.sprite.y/32}});
 expect(actual.x).toBe(5);expect(Math.abs(actual.y-6)).toBeLessThanOrEqual(.05);
});
