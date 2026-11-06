import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',testMatch:'staff.spec.ts',timeout:120_000,
 use:{baseURL:'http://127.0.0.1:5194',headless:true},
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5194 --strictPort',url:'http://127.0.0.1:5194',reuseExistingServer:false,timeout:30_000},
});
