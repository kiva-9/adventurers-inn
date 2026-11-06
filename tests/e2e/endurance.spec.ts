import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Explicit opt-in: 15 minutes must not silently lengthen ordinary smoke tests.
test.skip(process.env.INN_ENDURANCE !== '1', '设置 INN_ENDURANCE=1 才运行真实 15 分钟耐久');
test.use({ headless: true, launchOptions: { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' } });
test.setTimeout(1_000_000);

test('独立构建快照在真实浏览器中连续运行至少十五分钟', async ({ page, browser }) => {
  const directory='docs/evidence'; await mkdir(directory,{recursive:true});
  const started=Date.now();
  const report:{started:string;finished?:string;elapsedMs?:number;browser:string;target:string;consoleErrors:string[];consoleWarnings:string[];pageErrors:string[];failedRequests:string[];origins:string[];checkpoints:{atMs:number;action:string}[];failure?:string}={
    started:new Date(started).toISOString(),browser:browser.version(),target:'http://127.0.0.1:5197/',
    consoleErrors:[],consoleWarnings:[],pageErrors:[],failedRequests:[],origins:[],checkpoints:[]
  };
  const origins=new Set<string>();
  page.on('console',msg=>{if(msg.type()==='error')report.consoleErrors.push(msg.text());if(msg.type()==='warning')report.consoleWarnings.push(msg.text());});
  page.on('pageerror',e=>report.pageErrors.push(e.message));
  page.on('requestfailed',r=>report.failedRequests.push(`${r.url()}: ${r.failure()?.errorText}`));
  page.on('request',r=>{try{origins.add(new URL(r.url()).origin)}catch{/* data URLs do not have a network origin */}});
  const mark=(action:string)=>{const item={atMs:Date.now()-started,action};report.checkpoints.push(item);console.log(`[耐久 ${Math.floor(item.atMs/1000)} 秒] ${action}`)};
  const close=()=>page.getByRole('button',{name:'关闭',exact:true}).click();
  const save=async()=>{
    await page.getByRole('button',{name:'▣ 存档管理'}).click();
    await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'保存'}).click();
    await expect(page.locator('.toast').getByText('存档已保存。',{exact:true})).toBeVisible();
    await close();
  };
  const load=async()=>{
    await page.getByRole('button',{name:'▣ 存档管理'}).click();
    await page.locator('.row').filter({hasText:'存档 1'}).getByRole('button',{name:'载入'}).click();
    await expect(page.getByText('旅店许可评议')).toBeVisible();
  };
  try {
    await page.setViewportSize({width:1280,height:720});
    await page.goto(report.target);
    await page.getByRole('button',{name:'开始新旅程'}).click();
    await expect(page.getByText('旅店许可评议')).toBeVisible();
    await page.keyboard.press('d');
    await save(); await load();
    await page.screenshot({path:`${directory}/endurance-start.png`});
    mark('新游戏、走动、保存及载入');
    await page.getByRole('button',{name:'▶ 继续'}).click();
    let cycle=0;
    while(Date.now()-started<900_000) {
      await page.waitForTimeout(Math.min(55_000,900_000-(Date.now()-started)));
      cycle++;
      await expect(page.getByText('旅店许可评议')).toBeVisible();
      await page.getByRole('button',{name:'2×',exact:true}).click();
      await page.waitForTimeout(400);
      await page.getByRole('button',{name:'4×',exact:true}).click();
      await page.waitForTimeout(400);
      await page.getByRole('button',{name:'1×',exact:true}).click();
      const panel=cycle%3===0?'☷ 事件记录':cycle%3===1?'♜ 经营旅店':'♧ 人物关系';
      await page.getByRole('button',{name:panel}).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await close();
      if(cycle%4===0){await save();await load();}
      if(cycle===8)await page.screenshot({path:`${directory}/endurance-middle.png`});
      await page.getByRole('button',{name:'▶ 继续'}).click();
      mark(`第 ${cycle} 轮：倍速、${panel}${cycle%4===0?'、保存载入':''}`);
    }
    await page.getByRole('button',{name:'Ⅱ 暂停'}).click();
    await page.screenshot({path:`${directory}/endurance-end.png`});
    expect(Date.now()-started).toBeGreaterThanOrEqual(900_000);
    expect(report.pageErrors).toEqual([]);
    expect(report.consoleErrors).toEqual([]);
    expect(report.failedRequests).toEqual([]);
    expect([...origins].filter(o=>!o.startsWith('http://127.0.0.1:5197'))).toEqual([]);
  } catch(error) {
    report.failure=String(error); throw error;
  } finally {
    report.finished=new Date().toISOString();report.elapsedMs=Date.now()-started;report.origins=[...origins];
    await writeFile(`${directory}/endurance-report.json`,JSON.stringify(report,null,2),'utf8');
  }
});
