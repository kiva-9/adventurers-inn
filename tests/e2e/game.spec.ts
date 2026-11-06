import {test,expect} from '@playwright/test';

test('新游戏、经营、远征、存档与刷新载入',async({page})=>{
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`)});
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/');
 await page.getByRole('button',{name:'开始新旅程'}).click();
 await expect(page.getByText('旅店许可评议')).toBeVisible();
 await page.waitForTimeout(2000);
 await page.screenshot({path:'docs/evidence/new-game.png'});
 await page.setViewportSize({width:1440,height:900});
 await page.screenshot({path:'docs/evidence/new-game-1440.png'});
 await page.setViewportSize({width:1280,height:720});
 await page.keyboard.press('d');
 await page.getByRole('button',{name:'⌖ 小镇地图'}).click();
 await page.getByRole('button',{name:'前往'}).nth(1).click();
 await page.getByRole('button',{name:'♜ 经营旅店'}).click();
 await page.getByRole('button',{name:'购买 5 食材'}).click();
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('button',{name:'⌖ 小镇地图'}).click();
 await page.getByRole('button',{name:'前往'}).first().click();
 await page.getByRole('button',{name:'♜ 经营旅店'}).click();
 await page.getByRole('button',{name:'降价'}).click();
 await expect(page.getByText('房价：7 金')).toBeVisible();
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('button',{name:'⌖ 小镇地图'}).click();
 await page.getByRole('button',{name:'前往'}).first().click();
 await page.getByRole('button',{name:'⚑ 组织远征'}).click();
 await page.getByLabel('艾琳', {exact:false}).check();
 await page.getByRole('button',{name:'准备出发'}).click();
 await expect(page.getByText(/队伍前往 森林/)).toBeVisible();
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('button',{name:'等待一小时'}).click();
 await page.getByRole('button',{name:'等待一小时'}).click();
 await page.getByRole('button',{name:'⚑ 组织远征'}).click();
 await expect(page.getByRole('button',{name:'继续前进'})).toBeVisible();
 await page.getByRole('button',{name:'继续前进'}).click();
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('button',{name:'等待一小时'}).click();
 await page.getByRole('button',{name:'⚑ 组织远征'}).click();
 await expect(page.locator('.modal-body li').filter({hasText:'带回'})).toBeVisible();
 await page.screenshot({path:'docs/evidence/expedition.png'});
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('button',{name:'▣ 存档管理'}).click();
 await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'保存'}).click();
 await expect(page.locator('.toast')).toHaveText('存档已保存。');
 await page.reload();
 await page.getByRole('button',{name:'存档管理'}).click();
 await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'载入'}).click();
 await expect(page.getByText('旅店许可评议')).toBeVisible();
 await expect(page.getByText('游戏已暂停')).toBeVisible();
 expect(errors).toEqual([]);
});



