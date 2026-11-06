import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const base=process.env.PAGES_TEST_BASE||'/test-repo/';
if(!/^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(base))throw new Error('PAGES_TEST_BASE 必须是以斜杠开头和结尾的安全路径');
const chrome=process.env.PLAYWRIGHT_CHROME_EXECUTABLE||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export default defineConfig({
 testDir:'tests/pages', timeout:45_000,
 use:{baseURL:'http://127.0.0.1:5199',headless:true,launchOptions:existsSync(chrome)?{executablePath:chrome}:{}},
 webServer:{command:`npm run preview -- --host 127.0.0.1 --port 5199 --base=${base} --strictPort`,url:`http://127.0.0.1:5199${base}`,reuseExistingServer:false,timeout:30_000},
});
