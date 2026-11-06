// Informational requestAnimationFrame measurement, not a physical display benchmark.
import { chromium } from '@playwright/test';
const options = {headless:true};
if (process.env.PLAYWRIGHT_CHROME_EXECUTABLE) options.executablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE;
const browser = await chromium.launch(options);
const page = await browser.newPage({viewport:{width:1280,height:720}});
await page.goto(process.env.INN_PERF_URL || 'http://127.0.0.1:5188/');
await page.getByRole('button',{name:'开始新旅程'}).click();
await page.getByRole('button',{name:'▶ 继续'}).click();
await page.waitForTimeout(1000);
const result = await page.evaluate(() => new Promise(resolve => {
 let frames=0;const start=performance.now();
 const loop=now=>{frames++;if(now-start<10000)requestAnimationFrame(loop);else {const canvas=document.querySelector('canvas');const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');resolve({frames,elapsedMs:Math.round(now-start),fps:Math.round(frames*10000/(now-start))/10,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'});}};
 requestAnimationFrame(loop);
}));
console.log(JSON.stringify({browser:browser.version(),mode:'headless Chrome, 1280x720, requestAnimationFrame callbacks',...result}));
await browser.close();
