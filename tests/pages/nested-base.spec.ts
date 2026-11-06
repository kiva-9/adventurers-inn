import { test, expect } from '@playwright/test';
const base=process.env.PAGES_TEST_BASE||'/test-repo/';

test('生产构建可从仓库子路径加载、绘制并存取进度',async({page,request})=>{
 const errors:string[]=[], failed:string[]=[], paths:string[]=[], external:string[]=[], workers:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>failed.push(`${r.url()}: ${r.failure()?.errorText}`));
 page.on('request',r=>{const u=new URL(r.url());if(u.protocol==='http:'||u.protocol==='https:'){if(u.origin==='http://127.0.0.1:5199')paths.push(u.pathname);else external.push(u.origin);}});
 page.on('response',r=>{const u=new URL(r.url());if(u.origin==='http://127.0.0.1:5199'&&r.status()>=400)failed.push(`${r.status()} ${u.pathname}`);});
 page.on('worker',w=>workers.push(new URL(w.url()).pathname));
 const response=await page.goto(base);expect(response?.status()).toBe(200);
 await expect(page.getByRole('button',{name:'开始新旅程'})).toBeVisible();
 await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href',`${base}favicon.svg`);
 const icon=await request.get(`${base}favicon.svg`);expect(icon.status()).toBe(200);expect(await icon.text()).toContain('<svg');
 await page.getByRole('button',{name:'开始新旅程'}).click();
 await expect(page.getByText('旅店许可评议')).toBeVisible();
 await expect(page.locator('canvas')).toBeVisible();
 // Canvas existence alone is insufficient: wait for all three real Pixi assets and a painted scene.
 for(const asset of ['town-tiles.png','people.png','buildings.png'])
  await expect.poll(()=>paths.some(p=>p===`${base}assets/${asset}`)).toBe(true);
 await expect.poll(()=>workers.some(p=>p.startsWith(`${base}assets/worker-`)&&p.endsWith('.js'))).toBe(true);
 await expect.poll(async()=>{
  const clip=await page.locator('canvas').boundingBox();if(!clip)return 0;
  const png=await page.screenshot({clip:{x:clip.x+100,y:clip.y+150,width:100,height:100}});
  return page.evaluate(async src=>{const img=new Image();img.src='data:image/png;base64,'+src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;const colors=new Set<string>();for(let i=0;i<rgba.length;i+=4)colors.add(`${rgba[i]},${rgba[i+1]},${rgba[i+2]}`);return colors.size;},png.toString('base64'));
 }).toBeGreaterThan(10);
 await page.screenshot({path:`docs/evidence/pages-${base==='/'?'root':'nested'}.png`});
 await page.keyboard.press('d');
 await page.getByRole('button',{name:'⌖ 小镇地图'}).click();
 await page.locator('.modal .card').filter({has:page.getByRole('heading',{name:'集市'})}).getByRole('button',{name:'前往'}).click();
 await page.getByRole('button',{name:'♜ 经营旅店'}).click();
 await page.getByRole('button',{name:'购买 5 食材'}).click();
 await expect(page.locator('.topbar .stat').nth(2)).toContainText('29 / 4');
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('button',{name:'▣ 存档管理'}).click();
 await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'保存'}).click();
 await expect(page.locator('.toast')).toHaveText('存档已保存。');
 await page.reload();await page.getByRole('button',{name:'存档管理'}).click();
 await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'载入'}).click();
 await expect(page.locator('.location-label')).toContainText('集市');
 await expect(page.locator('.topbar .stat').nth(2)).toContainText('29 / 4');
 await expect(page.getByText('旅店许可评议')).toBeVisible();
 expect(paths.filter(p=>!p.startsWith(base))).toEqual([]);
 expect(external).toEqual([]);expect(errors).toEqual([]);expect(failed).toEqual([]);
});
