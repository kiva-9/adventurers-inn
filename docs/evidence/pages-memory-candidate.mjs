import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({headless:true,args:['--enable-precise-memory-info']});
const p=await b.newPage({viewport:{width:1280,height:720}});const errors=[];
p.on('pageerror',e=>errors.push(e.message));
await p.goto('https://kiva-9.github.io/adventurers-inn/');await p.getByRole('button',{name:'开始新旅程'}).click();await p.getByRole('button',{name:'▶ 时间已暂停 · 点击让小镇动起来'}).click();
const c=await p.context().newCDPSession(p);await c.send('Performance.enable');
const samples=[];const begin=Date.now();
for(let i=0;i<=10;i++){
 if(i>0)await new Promise(r=>setTimeout(r,60000));
 const btn=p.getByRole('button',{name:'♧ 人物关系'});if(await btn.isVisible()){await btn.click();await p.getByRole('button',{name:'关闭',exact:true}).click();const resume=p.getByRole('button',{name:'▶ 继续'});if(await resume.isVisible())await resume.click();}
 await c.send('HeapProfiler.collectGarbage');await p.waitForTimeout(250);
 const dom=await c.send('Memory.getDOMCounters');const metrics=await c.send('Performance.getMetrics');const metric=Object.fromEntries(metrics.metrics.map(x=>[x.name,x.value]));
 samples.push({elapsedMs:Date.now()-begin,day:await p.locator('.topbar .stat').first().innerText(),usedHeapBytes:metric.JSHeapUsedSize,documents:dom.documents,nodes:dom.nodes,jsEventListeners:dom.jsEventListeners,errors:[...errors]});
 await writeFile('pages-memory-observation.json',JSON.stringify({browser:b.version(),mode:'headless Chrome, forced GC before each sample, main page only',samples},null,2));console.log(JSON.stringify(samples.at(-1)));
}
await b.close();
