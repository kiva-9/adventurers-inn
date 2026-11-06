import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test.setTimeout(120_000);
async function close(p:Page){await p.getByRole('button',{name:'关闭',exact:true}).click()}
async function hour(p:Page){const clock=p.locator('.topbar .stat').first();const previous=await clock.innerText();await p.getByRole('button',{name:'等待一小时'}).click();await expect.poll(()=>clock.innerText()).not.toBe(previous)}
async function snapshot(p:Page){await p.getByRole('button',{name:'▣ 存档管理'}).click();const download=p.waitForEvent('download');await p.getByRole('button',{name:'导出 JSON'}).click();const filename=await (await download).path();if(!filename)throw new Error('无法读取导出的存档');const w=JSON.parse(await readFile(filename,'utf8'));await close(p);return w}

test('梅朵实际到岗并收取旅店支付的工资',async({page:p})=>{
 const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date(101));
 await p.goto('/');await p.getByRole('button',{name:'开始新旅程'}).click();
 await p.getByRole('button',{name:'♜ 经营旅店'}).click();await expect(p.getByText(/梅朵：等待到岗/)).toBeVisible();await close(p);
 await p.getByRole('button',{name:'⌖ 小镇地图'}).click();await p.locator('.card').filter({has:p.getByRole('heading',{name:'集市',exact:true})}).getByRole('button',{name:'前往',exact:true}).click();
 await hour(p);await hour(p);await p.getByRole('button',{name:'♜ 经营旅店'}).click();
 await expect(p.getByText(/梅朵：在旅店值班/)).toBeVisible();await p.screenshot({path:'docs/evidence/staff-on-duty.png'});await close(p);
 for(let i=0;i<13;i++)await hour(p);const before=await snapshot(p);expect(before.day).toBe(1);expect(before.minute).toBe(1380);
 await hour(p);const after=await snapshot(p);expect(after.day).toBe(2);expect(after.minute).toBe(0);
 expect(after.npc[12].money).toBeGreaterThanOrEqual(before.npc[12].money+4);
 expect(after.events.some((e:{kind:string,text:string})=>e.kind==='工资'&&e.text.includes('转入她的钱包'))).toBe(true);
 await p.getByRole('button',{name:'☷ 事件记录'}).click();await expect(p.locator('.log').getByText(/支付梅朵工资 4 金币，已转入她的钱包/)).toBeVisible();
 await p.screenshot({path:'docs/evidence/staff-wages.png'});expect(errors).toEqual([]);
});
