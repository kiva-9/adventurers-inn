import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
const chrome=process.env.PLAYWRIGHT_CHROME_EXECUTABLE||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test.use({launchOptions:existsSync(chrome)?{executablePath:chrome}:{},viewport:{width:1280,height:720}});
test.setTimeout(60_000);

/** Decode two real screenshot crops and count RGB pixels whose values changed. */
async function changedPixels(page:Page,a:Buffer,b:Buffer):Promise<number>{
 return page.evaluate(async ({first,second})=>{
  const decode=async(src:string)=>{const i=new Image();i.src='data:image/png;base64,'+src;await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const ctx=c.getContext('2d')!;ctx.drawImage(i,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
  const a=await decode(first),b=await decode(second);let changed=0;
  for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++;
  return changed;
 },{first:a.toString('base64'),second:b.toString('base64')});
}
async function colorsIn(page:Page,png:Buffer):Promise<number>{
 return page.evaluate(async src=>{const i=new Image();i.src='data:image/png;base64,'+src;await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const ctx=c.getContext('2d')!;ctx.drawImage(i,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;const colors=new Set<string>();for(let p=0;p<data.length;p+=4)colors.add(`${data[p]},${data[p+1]},${data[p+2]}`);return colors.size;},png.toString('base64'));
}
async function worldClip(page:Page,x:number,y:number,w:number,h:number){
 const box=await page.locator('canvas').boundingBox();if(!box)throw new Error('画布不可见');
 const scale=Math.min(box.width/992,box.height/544);
 return {x:Math.round(box.x+(box.width-992*scale)/2+x*scale),y:Math.round(box.y+(box.height-544*scale)/2+y*scale),width:Math.round(w*scale),height:Math.round(h*scale)};
}

test('暂停的角色和灯火仍有独立动画，正常走动且不产生 Pixi 错误',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'开始新旅程'}).click();
 await expect(page.locator('canvas')).toBeVisible();
 // Canvas may exist before atlases mount: require actual varied scene pixels.
 const scene=await worldClip(page,3*32,4*32,3*32,3*32);
 await expect.poll(async()=>colorsIn(page,await page.screenshot({clip:scene})),{timeout:10_000}).toBeGreaterThan(10);
 await expect(page.locator('.toast')).not.toContainText('画面初始化失败');
 const clock=page.locator('.topbar .stat').first();const frozen=await clock.innerText();
 const player=await worldClip(page,5*32+6,7*32+2,22,30);
 const fire=await worldClip(page,27*32+8,4*32+8,18,22);
 const p1=await page.screenshot({clip:player});const f1=await page.screenshot({clip:fire});
 await page.waitForTimeout(260);const f2=await page.screenshot({clip:fire});
 await page.waitForTimeout(650);const p2=await page.screenshot({clip:player});
 await Promise.all([writeFile('docs/evidence/animation-idle-a.png',p1),writeFile('docs/evidence/animation-idle-b.png',p2),writeFile('docs/evidence/animation-fire-a.png',f1),writeFile('docs/evidence/animation-fire-b.png',f2)]);
 const playerDiff=await changedPixels(page,p1,p2),fireDiff=await changedPixels(page,f1,f2);
 console.log('暂停：角色变化像素',playerDiff,'火光变化像素',fireDiff);
 expect(playerDiff).toBeGreaterThan(8);expect(fireDiff).toBeGreaterThan(8);
 expect(await clock.innerText()).toBe(frozen);
 await page.screenshot({path:'docs/evidence/animation-paused.png'});
 // Observe actual UI-driven player movement while the world is running.
 await page.getByRole('button',{name:'▶ 继续'}).click();
 const walking=await worldClip(page,5*32+4,7*32,80,32);
 const before=await page.screenshot({clip:walking});await page.keyboard.press('d');
 await page.waitForTimeout(70);const mid=await page.screenshot({clip:walking});
 await page.waitForTimeout(240);const after=await page.screenshot({clip:walking});
 await Promise.all([writeFile('docs/evidence/animation-step-a.png',before),writeFile('docs/evidence/animation-step-b.png',mid),writeFile('docs/evidence/animation-step-c.png',after)]);
 const startMove=await changedPixels(page,before,mid),completeMove=await changedPixels(page,before,after);
 console.log('移动：途中变化像素',startMove,'到达变化像素',completeMove);
 expect(startMove).toBeGreaterThan(8);expect(completeMove).toBeGreaterThan(8);
 await page.getByRole('button',{name:'Ⅱ 暂停'}).click();
 await page.screenshot({path:'docs/evidence/animation-walk.png'});
 await page.reload();await page.getByRole('button',{name:'继续旅程'}).click();await expect(page.locator('canvas')).toBeVisible();
 await expect.poll(async()=>colorsIn(page,await page.screenshot({clip:scene})),{timeout:10_000}).toBeGreaterThan(10);
 expect(errors).toEqual([]);
});

test('浏览器合成快照：4× 多格路线连续插值，换场景立即定位',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 // This isolated renderer fixture supplies two synthetic snapshots; it never touches the game's Worker or save.
 await page.evaluate(async()=>{
  document.body.innerHTML='<div id="visual-fixture"></div>';
  const rendererPath='/src/renderer.ts',enginePath='/src/engine.ts';
  const {WorldRenderer}=await import(rendererPath),{createWorld}=await import(enginePath);
  const world=createWorld(7),npc=world.npc[0];
  world.npc=[npc];world.player={place:'inn',x:25,y:14};world.speed=4;world.paused=true;
  npc.place='inn';npc.away=false;npc.x=2;npc.y=8;npc.action='在镇上走动';
  npc.route=Array.from({length:12},(_,i)=>({x:3+i,y:8}));
  const renderer=new WorldRenderer();await renderer.mount(document.getElementById('visual-fixture')!);renderer.update(world);
  (window as any).__visualFixture={renderer,world,npc};
 });
 await expect(page.locator('#visual-fixture canvas')).toBeVisible();await page.waitForTimeout(100);
 await page.locator('#visual-fixture canvas').screenshot({path:'docs/evidence/animation-npc-before.png'});
 const start=await page.evaluate(()=>{
  const f=(window as any).__visualFixture;f.npc.x=14;f.npc.route=[];f.renderer.update(f.world);
  return f.renderer.views.get(f.npc.name).sprite.x;
 });
 expect(start).toBe(2*32);
 await page.waitForTimeout(85);
 const mid=await page.evaluate(()=>(window as any).__visualFixture.renderer.views.get((window as any).__visualFixture.npc.name).sprite.x);
 await page.locator('#visual-fixture canvas').screenshot({path:'docs/evidence/animation-npc-mid.png'});
 expect(mid).toBeGreaterThan(start);expect(mid).toBeLessThan(14*32);
 await page.waitForTimeout(300);
 const end=await page.evaluate(()=>(window as any).__visualFixture.renderer.views.get((window as any).__visualFixture.npc.name).sprite.x);
 await page.locator('#visual-fixture canvas').screenshot({path:'docs/evidence/animation-npc-end.png'});
 expect(end).toBe(14*32);
 console.log('合成 4× 快照：角色横坐标',start,mid,end);
 // Equal old and new targets: force a scene change before the current interpolation finishes.
 const sceneReset=await page.evaluate(()=>{
  const f=(window as any).__visualFixture,w=f.world,r=f.renderer;
  w.player.x=3;w.player.y=10;r.update(w);
  w.player.x=4;r.update(w);
  w.player.place='guild';r.update(w);
  const view=r.views.get('__player');return {x:view.sprite.x,y:view.sprite.y,progress:view.progress};
 });
 expect(sceneReset).toEqual({x:4*32,y:10*32,progress:1});
 await page.locator('#visual-fixture canvas').screenshot({path:'docs/evidence/animation-scene-reset.png'});
 expect(errors).toEqual([]);
 await page.evaluate(()=>{(window as any).__visualFixture.renderer.destroy();delete (window as any).__visualFixture;});
});
