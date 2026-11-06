import { test, expect, type Page } from '@playwright/test';

async function beginCrisis(page:Page) {
 await page.goto('/');
 await page.getByRole('button',{name:'开始新旅程'}).click();
 await expect(page.getByText('旅店许可评议')).toBeVisible();
 for(let day=2;day<=12;day++) {
  await page.getByRole('button',{name:'等待至明早'}).click();
  await expect(page.locator('.topbar .stat').first()).toContainText(`第 ${day} / 30 日`);
 }
 await expect(page.getByRole('button',{name:/供给请求 · 待回应/})).toBeVisible();
}
async function close(page:Page){await page.getByRole('button',{name:'关闭',exact:true}).click();}

test('供给请求：采购、捐赠、载入并改选其他方',async({page})=>{
 await beginCrisis(page);
 await page.getByRole('button',{name:'⌖ 小镇地图'}).click();
 await page.locator('.modal .card').filter({has:page.getByRole('heading',{name:'集市'})}).getByRole('button',{name:'前往'}).click();
 await page.getByRole('button',{name:'♜ 经营旅店'}).click();
 await page.getByRole('button',{name:'购买 20 食材（80 金）'}).click();
 await expect(page.locator('.topbar .stat').nth(2)).toContainText('20 /');
 await close(page);
 await page.getByRole('button',{name:'▣ 存档管理'}).click();
 await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'保存'}).click();
 await expect(page.locator('.toast')).toHaveText('存档已保存。');
 await close(page);
 await page.getByRole('button',{name:/供给请求 · 待回应/}).click();
 await expect(page.locator('.modal .warning')).toContainText('第 15 日结束前决定');
 await page.screenshot({path:'docs/evidence/supply-crisis.png'});
 await page.getByRole('button',{name:'交付 8 份食材'}).click();
 await expect(page.locator('.modal-body')).toContainText('食材交给商会');
 await expect(page.locator('.topbar .stat').nth(2)).toContainText('12 /');
 await expect(page.locator('.goal strong')).toContainText('商会 1');
 await close(page);
 await page.getByRole('button',{name:'▣ 存档管理'}).click();
 await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'载入'}).click();
 await expect(page.getByRole('button',{name:/供给请求 · 待回应/})).toBeVisible();
 await expect(page.locator('.topbar .stat').nth(2)).toContainText('20 /');
 await page.getByRole('button',{name:/供给请求 · 待回应/}).click();
 await page.getByRole('button',{name:'交付 3 份草药'}).click();
 await expect(page.locator('.modal-body')).toContainText('草药交给守望者');
 await expect(page.locator('.goal strong')).toContainText('守望者 1');
 await expect(page.locator('.goal strong')).toContainText('商会 0');
});

test('新请求中断一次等待，未回应时正常到期',async({page})=>{
 await beginCrisis(page);
 for(let day=13;day<=16;day++) {
  await page.getByRole('button',{name:'等待至明早'}).click();
  await expect(page.locator('.topbar .stat').first()).toContainText(`第 ${day} / 30 日`);
 }
 await page.getByRole('button',{name:/供给请求 · 已处理/}).click();
 await expect(page.locator('.modal-body')).toContainText('旅店保留库存');
 await expect(page.locator('.goal strong')).toContainText('商会 0');
 await expect(page.locator('.goal strong')).toContainText('守望者 0');
});
