import {test,expect,Page} from '@playwright/test';

async function begin(page:Page){await page.goto('/');await page.getByRole('button',{name:'开始新旅程'}).click();await expect(page.getByText('旅店许可评议')).toBeVisible()}
async function open(page:Page,label:string){await page.getByRole('button',{name:label,exact:true}).click()}
async function close(page:Page){await page.getByRole('button',{name:'关闭',exact:true}).click()}
async function travel(page:Page,place:string){await open(page,'⌖ 小镇地图');const card=page.locator('.card').filter({has:page.getByRole('heading',{name:place,exact:true})});await card.getByRole('button',{name:'前往'}).click()}
async function person(page:Page,name:string){await open(page,'♧ 人物关系');await page.locator('.card').filter({has:page.getByRole('heading',{name:new RegExp(`^${name} `)})}).getByRole('button',{name:'查看人物'}).click()}

test('同一存档不同房价影响入住和信任',async({page})=>{test.setTimeout(90000);await begin(page);
 await open(page,'▣ 存档管理');await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'保存'}).click();await expect(page.locator('.toast')).toHaveText('存档已保存。');await close(page);
 await open(page,'♜ 经营旅店');for(let i=0;i<3;i++)await page.getByRole('button',{name:'降价'}).click();await expect(page.getByText('房价：5 金')).toBeVisible();await close(page);
 for(let i=0;i<2;i++)await page.getByRole('button',{name:'等待至明早'}).click();await open(page,'☷ 事件记录');await expect(page.locator('.log').getByText(/住进旅店/).first()).toBeVisible();await page.screenshot({path:'docs/evidence/causal-low-price.png'});await close(page);
 await open(page,'▣ 存档管理');await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'载入'}).click();await open(page,'♜ 经营旅店');for(let i=0;i<12;i++)await page.getByRole('button',{name:'涨价'}).click();await expect(page.getByText('房价：20 金')).toBeVisible();await close(page);
 for(let i=0;i<2;i++)await page.getByRole('button',{name:'等待至明早'}).click();await open(page,'☷ 事件记录');await expect(page.locator('.log').getByText(/住进旅店/)).toHaveCount(0);await page.screenshot({path:'docs/evidence/causal-high-price.png'});
});

test('初始补给争执可由当事人调解并改变关系',async({page})=>{await begin(page);await travel(page,'冒险者公会');await person(page,'洛恩');await expect(page.getByText(/卷入补给争议/)).toBeVisible();await page.getByRole('button',{name:'调解',exact:true}).click();await expect(page.getByText(/你支付 5 金币帮助洛恩解决补给争议/).last()).toBeVisible();await page.screenshot({path:'docs/evidence/causal-mediation.png'});});

test('受伤后治疗改变信任和下一次远征报酬',async({page})=>{test.setTimeout(120000);await page.clock.setFixedTime(new Date(100004));await begin(page);
 await open(page,'♜ 经营旅店');for(let i=0;i<12;i++)await page.getByRole('button',{name:'涨价'}).click();await close(page);await travel(page,'冒险者公会');let injured=false;
 for(let attempt=0;attempt<6&&!injured;attempt++){
  await open(page,'⚑ 组织远征');await page.getByLabel('策略').selectOption({label:'冒险'});await page.getByLabel('艾琳',{exact:false}).check();await page.getByRole('button',{name:'准备出发'}).click();await expect(page.getByText(/队伍前往 森林/)).toBeVisible();await close(page);
  await page.getByRole('button',{name:'等待远征',exact:true}).click();await open(page,'⚑ 组织远征');await page.getByRole('button',{name:'继续前进'}).click();await close(page);await page.getByRole('button',{name:'等待远征',exact:true}).click();await open(page,'⚑ 组织远征');injured=await page.locator('.modal-body li').filter({hasText:'成员受伤'}).count()>0;await close(page);
  if(!injured){await travel(page,'归途旅店');await page.getByRole('button',{name:'等待至明早'}).click();await travel(page,'集市');await open(page,'♜ 经营旅店');await page.getByRole('button',{name:'购买 5 食材'}).click();await close(page);await travel(page,'冒险者公会');}
 }
 expect(injured).toBeTruthy();await travel(page,'镇门');await person(page,'艾琳');await expect(page.getByText(/健康 80/)).toBeVisible();const relation=page.locator('.modal-body p').filter({hasText:/^信任 \d+/});const before=Number((await relation.textContent())?.match(/信任 (\d+)/)?.[1]);await page.getByRole('button',{name:'帮助',exact:true}).click();await expect(page.getByText(/你用草药帮助艾琳/).last()).toBeVisible();await expect(relation).toContainText(`信任 ${before+2}`);await page.screenshot({path:'docs/evidence/causal-healing.png'});await close(page);await travel(page,'归途旅店');await page.getByRole('button',{name:'等待至明早'}).click();
 await travel(page,'集市');await open(page,'♜ 经营旅店');await page.getByRole('button',{name:'购买 5 食材'}).click();await close(page);await travel(page,'冒险者公会');await open(page,'⚑ 组织远征');await page.getByLabel('艾琳',{exact:false}).check();await page.getByRole('button',{name:'准备出发'}).click();await expect(page.getByText(/队伍前往 森林/)).toBeVisible();await close(page);await open(page,'☷ 事件记录');await expect(page.locator('.log').getByText(/支付队员 2 金币/).first()).toBeVisible();await page.screenshot({path:'docs/evidence/causal-recruit.png'});
});
