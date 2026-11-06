import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Use the locally installed browser, not Playwright's separately downloaded binary.
const chrome = process.env.PLAYWRIGHT_CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test.use({ launchOptions: existsSync(chrome) ? {executablePath:chrome} : {}, viewport: {width:1280,height:720} });
test.setTimeout(360_000);

const endHeading = (p: Page) => p.locator('.modal-header h2').filter({hasText:'三十日 ·'});
async function start(p: Page) {
  await p.goto('/');
  await p.getByRole('button', {name:'开始新旅程'}).click();
  await expect(p.getByText('旅店许可评议')).toBeVisible();
  // The ordinary export UI provides the generated seed as evidence; it never mutates the world.
  await p.getByRole('button',{name:'▣ 存档管理'}).click();
  const downloadPromise=p.waitForEvent('download');
  await p.getByRole('button',{name:'导出 JSON'}).click();
  const download=await downloadPromise;
  const file=await download.path();
  if (!file) throw new Error('无法读取 UI 导出的存档');
  const exported=JSON.parse(await readFile(file,'utf8')) as {seed:number};
  console.log('新游戏种子：', exported.seed);
  await p.getByRole('button',{name:'关闭',exact:true}).click();
}
async function travel(p: Page, place: string) {
  await p.getByRole('button', {name:'⌖ 小镇地图'}).click();
  const card = p.locator('.modal-body .card').filter({has:p.getByRole('heading',{name:place,exact:true})});
  const go = card.getByRole('button',{name:'前往',exact:true});
  if (await go.count()) await go.click();
  else await p.getByRole('button',{name:'关闭',exact:true}).click();
  await expect(p.locator('.location-label')).toContainText(place);
}
async function hour(p: Page) {
  const time = p.locator('.topbar .stat').first();
  const before = await time.innerText();
  await p.getByRole('button',{name:'等待一小时'}).click();
  await expect.poll(async()=>await time.innerText(), {timeout:10_000}).not.toBe(before);
}
async function morning(p: Page) {
  const time = p.locator('.topbar .stat').first();
  const beforeDay = await readDay(p);
  await p.getByRole('button',{name:'等待至明早'}).click();
  try {
    await expect.poll(async()=>await endHeading(p).isVisible() || await readDay(p)>beforeDay, {timeout:10_000}).toBe(true);
  } catch (error) {
    console.log('等待未推进时界面：', (await p.locator('body').innerText()).slice(0, 1500));
    await p.screenshot({path:'docs/evidence/chapter-wait-stalled.png'});
    throw error;
  }
  console.log('明早：', await time.innerText());
}
async function readDay(p: Page) {
  const s=await p.locator('.topbar .stat').first().innerText();
  return Number(s.match(/第\s*(\d+)/)?.[1]);
}
async function provision(p: Page) {
  const stock = await p.locator('.topbar .stat').nth(2).innerText();
  const food = Number(stock.match(/(\d+)\s*\//)?.[1]);
  const cash = Number((await p.locator('.topbar .stat').nth(1).innerText()).match(/(\d+)\s*金/)?.[1]);
  if (food > 10) return;
  const batches = Math.min(4, Math.floor(cash / 20));
  if (!batches) { console.log('资金不足，无法购买一批食材'); return; }
  await travel(p,'集市');
  await p.getByRole('button',{name:'♜ 经营旅店'}).click();
  for(let i=0;i<batches;i++) {
    const before = await p.locator('.topbar .stat').nth(2).innerText();
    await p.getByRole('button',{name:'购买 5 食材'}).click();
    await expect.poll(async()=>await p.locator('.topbar .stat').nth(2).innerText()).not.toBe(before);
  }
  await p.getByRole('button',{name:'关闭',exact:true}).click();
  await travel(p,'归途旅店');
}
async function waitUntil(p: Page, day: number) {
  let last = 0;
  while(await readDay(p)<day && !(await endHeading(p).isVisible())) {
    const today=await readDay(p);
    if(today!==last) { await provision(p); last=today; }
    await morning(p);
  }
}
async function accept(p: Page, title: string) {
  const card=p.locator('.modal-body .card').filter({has:p.getByRole('heading',{name:new RegExp(title)})});
  await card.getByRole('button',{name:'接受委托'}).click();
  await expect(card).toContainText(/进行中|完成/);
}
async function eligibleMembers(p: Page) {
  const candidates:{name:string; skill:string; fatigue:number}[]=[];
  for (const name of ['艾琳','洛恩','米娅','柯尔','菲娅','阿岚','布鲁诺','露卡','赛拉']) {
    await p.getByRole('button',{name:'♧ 人物关系'}).click();
    const card=p.locator('.modal-body .card').filter({has:p.getByRole('heading',{name:new RegExp(`^${name}`)})});
    await card.getByRole('button',{name:'查看人物'}).click();
    const info=await p.locator('.modal-body').innerText();
    const fatigue=Number(info.match(/疲劳\s*(\d+)/)?.[1]);
    const health=Number(info.match(/健康\s*(\d+)/)?.[1]);
    if(fatigue<=85 && health>=50) candidates.push({name,skill:['洛恩','菲娅','阿岚'].includes(name)?'探索':'其他',fatigue});
    await p.getByRole('button',{name:'关闭',exact:true}).click();
  }
  candidates.sort((a,b)=>Number(b.skill==='探索')-Number(a.skill==='探索') || a.fatigue-b.fatigue);
  return candidates.slice(0,3).map(n=>n.name);
}
async function forest(p: Page) {
  for(let attempt=0;attempt<4;attempt++) {
    const members=await eligibleMembers(p);
    console.log('可出征队员：', members);
    if(!members.length) throw new Error('所有冒险者疲劳超过 85 或健康不足，无法合法出发。');
    await p.getByRole('button',{name:'⚑ 组织远征'}).click();
    for(const name of members) await p.getByLabel(name,{exact:false}).check();
    await p.getByRole('button',{name:'准备出发'}).click();
    await expect(p.getByText(/队伍前往 森林/)).toBeVisible();
    await p.getByRole('button',{name:'关闭',exact:true}).click();
    await hour(p); await hour(p);
    await p.getByRole('button',{name:'⚑ 组织远征'}).click();
    await expect(p.getByRole('button',{name:'继续前进'})).toBeVisible();
    await p.getByRole('button',{name:'继续前进'}).click();
    await p.getByRole('button',{name:'关闭',exact:true}).click();
    await hour(p);
    await p.getByRole('button',{name:'▤ 委托告示'}).click();
    const card=p.locator('.modal-body .card').filter({has:p.getByRole('heading',{name:/勘察森林/})});
    const finished=await card.getByText('完成',{exact:true}).isVisible();
    await p.getByRole('button',{name:'关闭',exact:true}).click();
    if(finished) return;
  }
  throw new Error('四次合法森林远征均未完成调查委托。');
}

test('真实 UI：守望路线从新游戏到成功结局', async ({page}) => {
  await page.clock.setFixedTime(new Date(850449595));
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await start(page);
  await page.getByRole('button',{name:'♜ 经营旅店'}).click();
  await page.getByRole('button',{name:'解雇帮手'}).click();
  await page.getByRole('button',{name:'餐价 +'}).click();
  await page.getByRole('button',{name:'餐价 +'}).click();
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await travel(page,'冒险者公会');
  await page.getByRole('button',{name:'▤ 委托告示'}).click();
  await accept(page,'补给诊所');
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await travel(page,'归途旅店');
  await waitUntil(page,4);
  await expect(endHeading(page)).toBeHidden();
  await provision(page);
  await travel(page,'冒险者公会');
  await page.getByRole('button',{name:'▤ 委托告示'}).click();
  await accept(page,'勘察森林');
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await forest(page);
  await travel(page,'归途旅店');
  await page.getByRole('button',{name:'♜ 经营旅店'}).click();
  await page.getByRole('button',{name:'关闭赊账'}).click();
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await waitUntil(page,31);
  await expect(endHeading(page)).toContainText('守望相助');
  console.log('成功结算：', (await page.locator('.modal-backdrop .modal-body').last().innerText()).slice(0,250));
  await page.screenshot({path:'docs/evidence/chapter-success.png'});
  await page.getByRole('button',{name:'继续经营',exact:true}).click();
  await expect(endHeading(page)).toBeHidden();
  await expect(page.locator('.topbar .stat').first()).toContainText('第 31 日');
  await expect(page.locator('.goal')).toContainText('守望相助');
  expect(errors).toEqual([]);
});

test('真实 UI：未达评议目标的失败和重新开始', async ({page}) => {
  await page.clock.setFixedTime(new Date(850473469));
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await start(page);
  while(!(await endHeading(page).isVisible())) await morning(page);
  await expect(endHeading(page)).toContainText('失败');
  console.log('失败结算：', (await page.locator('.modal-backdrop .modal-body').last().innerText()).slice(0,250));
  await page.screenshot({path:'docs/evidence/chapter-failure.png'});
  // Read-only inspection waits for the browser's own transaction; reload and continue through UI.
  await expect.poll(()=>page.evaluate(async()=>await new Promise<string|null>((resolve,reject)=>{const r=indexedDB.open('returning-inn-save-v1',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result;const tx=db.transaction('slots','readonly');const get=tx.objectStore('slots').get('auto');get.onsuccess=()=>{resolve(get.result?.chapter??null);db.close()};get.onerror=()=>reject(get.error)}}))).toBe('失败');
  await page.reload();await page.getByRole('button',{name:'继续旅程'}).click();await expect(endHeading(page)).toContainText('失败');
  await page.getByRole('button',{name:'重新开始'}).click();
  await expect(endHeading(page)).toBeHidden();
  await expect(page.locator('.topbar .stat').first()).toContainText('第 1 / 30 日');
  await page.screenshot({path:'docs/evidence/chapter-restart.png'});
  expect(errors).toEqual([]);
});
