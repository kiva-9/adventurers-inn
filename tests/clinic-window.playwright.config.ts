import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
const chrome=process.env.PLAYWRIGHT_CHROME_EXECUTABLE || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export default defineConfig({testDir:'./e2e',testMatch:'clinic-window.spec.ts',timeout:30000,use:{baseURL:'http://127.0.0.1:5195',headless:true,launchOptions:existsSync(chrome)?{executablePath:chrome}:{}},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5195 --strictPort',url:'http://127.0.0.1:5195',reuseExistingServer:false,timeout:30000}});
