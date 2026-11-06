import {test,expect,type Page} from '@playwright/test';

test.setTimeout(120_000);
async function close(page:Page){await page.getByRole('button',{name:'关闭',exact:true}).click()}
async function hour(page:Page){
 const clock=page.locator('.topbar .stat').first();const before=await clock.innerText();
 await page.getByRole('button',{name:'等待一小时'}).click();
 await expect.poll(()=>clock.innerText()).not.toBe(before);
}

test('居民通过真实时间推进承接、出发与完成诊所委托',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:720});
 // 固定浏览器当前时间只选择普通新游戏的种子 101，不写入任何游戏状态。
 await page.clock.setFixedTime(new Date(101));
 await page.goto('/');await page.getByRole('button',{name:'开始新旅程'}).click();
 await expect(page.getByText('第 1 / 30 日')).toBeVisible();
 for(let day=2;day<=10;day++){
  await page.getByRole('button',{name:'等待至明早'}).click();
  await expect(page.getByText(`第 ${day} / 30 日`)).toBeVisible();
 }
 // 在第 10 日结束，观察居民已经接单但仍需前往镇门。
 for(let i=0;i<16;i++)await hour(page);
 await expect(page.getByText('第 11 / 30 日')).toBeVisible();
 await page.getByRole('button',{name:'▤ 委托告示'}).click();
 const card=page.locator('.modal-body .card').filter({has:page.getByRole('heading',{name:/补给诊所/})});
 await expect(card).toContainText('他人进行中');await expect(card).toContainText('承接：米娅');
 await expect(card).toContainText('正在前往镇门');
 await page.screenshot({path:'docs/evidence/npc-contract-in-progress.png'});await close(page);
 // 行进及四小时采购都由世界正常逐小时运行。
 for(let i=0;i<5;i++)await hour(page);
 await page.getByRole('button',{name:'▤ 委托告示'}).click();
 await expect(card).toContainText('他人完成');await expect(card).toContainText('承接：米娅');
 await page.screenshot({path:'docs/evidence/npc-contract.png'});await close(page);
 await page.getByRole('button',{name:'☷ 事件记录'}).click();
 const log=page.locator('.modal-body .log');
 await expect(log.getByText(/米娅接下「补给诊所」/)).toBeVisible();
 await expect(log.getByText(/米娅从镇门出发，自付 12 金币/)).toBeVisible();
 await expect(log.getByText(/米娅向诊所交付四份草药，领取 24 金币/)).toBeVisible();
 await page.screenshot({path:'docs/evidence/npc-contract-log.png'});
 expect(errors).toEqual([]);
});
