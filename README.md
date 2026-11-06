# 归途旅店：小镇三十日

开发中的原创中文单机经营游戏。请先阅读 [目标与当前状态](GOAL.md) 和 [验证记录](docs/VALIDATION.md)；当前尚未完成任务书的全部验收。

需要 Node.js 22.12 或更新版本：

```sh
npm ci
npm run dev
```

打开终端显示的本机地址（默认 http://127.0.0.1:5187）。WASD 或方向键移动，E 交互，面板中可经营、采购、接受委托和组织远征。暂停与倍速用于阅读和推进。第 30 日评议条件和提前失败条件见 GOAL.md。存档保存在当前浏览器的 IndexedDB，换设备或清理站点数据前请导出 JSON。

可选模型增强默认关闭；配置与限制见 [本地代理说明](server/README.md)。不配置也可使用离线对话。运行 `npm run typecheck`、`npm test`、`npm run build`；`npm run preview` 在本机 5188 提供构建预览。浏览器测试运行 `npm run test:e2e`，如本机没有 Playwright 浏览器，先执行 `npx playwright install chromium`。15 分钟耐久测试需显式设置 `INN_ENDURANCE=1` 并按测试脚本指定独立预览。其他验证状态见验证记录。

第 12 日会出现一次限时小镇供给请求：第 15 日结束前选择支持商会、支持守望者或保留库存；侧栏入口会显示待回应状态。每项代价和影响在选择前展示，逾期默认保留库存。
