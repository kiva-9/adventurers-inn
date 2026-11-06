# 验证记录

## 环境与命令

2026-11-07，Windows，本机 Node 24.18.0、npm 12.1.0。`npm install` 成功；npm 提示阻止了 esbuild 的安装脚本，但实际构建成功。当前结果以命令实际输出为准：

- `npm run typecheck`：通过。
- `npm test`：Vitest 31 项、Node 模拟代理 4 项通过；覆盖采购与赊账、重复结算、路径、存档、休息、价格与帮助、等待中断、模型回退等。
- `npm run build`：成功；主包约 571 kB，Vite 给出大块警告。
- `npm run test:e2e`：完整执行 `npm run test:e2e -- --workers=1 --reporter=line --output=test-results-full`：6 项通过、15 分钟耐久项按设计默认跳过（41.7 秒；随后增加存档完整性校验后又单独重跑 4 项冒烟/因果测试和 2 项章节测试，均通过）。其中包含新游戏、走动、采购、改价、远征途中选择与归来、手动存档、刷新载入和成功/失败章节。
- [调参种子原始输出](evidence/tuning-seeds.jsonl)。`npm run validate:sim`：执行调参种子 101、202、303、404、505、606、707、808、1709、2811；各走守望和商路策略，完成 30 日，两路线均到各自成功结局且无拒绝命令。守望第 4 日、商路第 10 日达到主要评议条件，期末资金约 2140–2187。经济过于宽松，不能把成功等同于完成了平衡验收。
- 稳定后另运行 `npx tsx scripts/validate-sim.ts 3141592 2718281`，两种策略共 4 局均成功，资金 2140–2177、借款 72、无拒绝命令。记录见 [留出种子输出](evidence/holdout-seeds.jsonl)。这两个种子在运行前未用于调参；无画面模拟不等于真实浏览器通关。

## 真实浏览器与因果

使用本机 Chrome 和 Playwright，桌面 1280×720、1440×900 截图已目视检查。画面可读，但旅店仍较空。截图：[1280](evidence/latest-1280.png)、[1440](evidence/latest-1440.png)。另在全新克隆的 5198 预览、1280×720 无头 Chrome 156.0.8078.80 中，以 `scripts/measure-fps.mjs` 方法采样 10,004 ms，得到 1601 次 requestAnimationFrame 回调（160.0 次/秒）；WebGL 报告 ANGLE / NVIDIA GeForce RTX 4060 Ti / D3D11。回调频率不证明实体显示器呈现帧率，也未测帧时间尾部或整局性能。

`npx playwright test tests/e2e/chapter.spec.ts --workers=1 --reporter=line --output=test-results-chapter` 一轮 2/2 通过，29.6 秒；从普通新游戏和合法 UI 操作开始，没有修改游戏状态；固定浏览器时钟只用于选择可复现的新游戏种子。固定浏览器时钟重现的守望成功局种子 850449595：完成诊所与森林委托，第 30 日资金 1339、声望 4、守望者 4，结局 [守望相助](evidence/chapter-success.png)。固定浏览器时钟重现的失败局种子 850473469：不接委托，正常逐日等待，第 30 日资金 208、声望和双方支持均为 0，[评议失败](evidence/chapter-failure.png)；点击重开回到第 1 日，见 [重开](evidence/chapter-restart.png)。浏览器自动化耗时不能冒充人工游玩时长。另一商会成功路线目前仅有无画面模拟，未完成真实 UI 通关验证。

`npx playwright test tests/e2e/causal.spec.ts --workers=1 --reporter=line --output=test-results-causal` 一轮 3/3 通过：

1. 同一新游戏手动存档分支：房价降至 5 后两夜出现入住及信任增长；载入同一初始存档、涨至 20 后两夜没有入住。[低价](evidence/causal-low-price.png)、[高价](evidence/causal-high-price.png)。这是对照；对招募的后续影响由信任折扣规则支持，但该截图未单独验证招募。
2. 初始洛恩与诺亚的补给争执使双方关系为 -1；在洛恩附近支付 5 金调解后，双方关系恢复到 0，信任与守望者支持增加；重复调解由规则测试拒绝。[调解截图](evidence/causal-mediation.png)。后续合作差异尚无独立浏览器截图。
3. 浏览器以固定时钟产生种子 100004，合法派艾琳冒险、选择继续，队伍受挫、健康 100→80；在镇门用 1 草药治疗后健康 100、信任 0→2；后续派队支付 2 金而非原 4 金。[治疗经历](evidence/causal-healing.png)、[再次招募](evidence/causal-recruit.png)。固定时钟仅用于选择新游戏种子，没有写入存档或状态。

第一次独立浏览器耐久观察实际运行 900,977 毫秒，完成 17 轮面板、倍速和多次存读档；页面错误 0、失败请求 0、控制台错误 1（缺少 favicon 导致 404），因此按失败记录。随后已补本地图标，单独浏览器冒烟同时检查控制台及 HTTP 错误并通过。该次快照早于休息、床位与碰撞修复，不覆盖当前代码；修复后第二轮在第 56 秒因发现缺失委托的损坏存档能通过校验而主动中断；增加校验和回归测试后，第三轮 15 分钟观察正在执行。未采样内存或监听器数量。实际手工完整游玩时长、实体显示器呈现帧率及最终版本长时间运行尚未测量。

## 参考和边界

模拟模型服务用于协议和失败分支测试；没有验证真实 Ollama 模型。A* 四邻接算法有绕障、不可达测试，玩家移动已按当前场景的建筑和家具阻挡，含动态床位；NPC 跨地点 A* 仍只使用边界，尚未使用各场景障碍，地图目的地切换仍使用地图菜单。NPC 的人物间关系、消息和工作是简化规则，不是完整论文代理；自动竞争委托仍是简化的到期接走事件。事件和记忆有限，长期记录可能淘汰早期因果。经济偏宽松，流程仍未满足任务书对完整世界深度、最终性能与全部验证的严格要求。以上不能以已实现条目取代。

## 首次远端克隆验证

已从私有远端在新的临时目录克隆提交 `90a9107b7cecd6e44ec5d7b2c74c17b9f7e7645e`，`npm ci`、`npm run typecheck`、`npm test`、`npm run build` 均成功。该克隆的构建产物通过 `npm run preview -- --port 5198 --strictPort` 启动，使用真实浏览器完成新游戏、移动、手动保存、刷新与载入；1 项通过。该次是碰撞和 favicon 修复之前的提交，最终提交仍需新克隆复核。

### 供给危机独立验证

- 在基于 `7d9d098` 的独立工作树中新增一次性事件。`npx vitest run tests/supply-crisis.test.ts`：5 项通过，覆盖两种物资交付、库存不足、保留/逾期、重复操作、等待中断和存档恢复。专项测试已纳入 `npm test`。
- 隔离端口 5195 的 Chrome 浏览器测试：新增 `tests/e2e/supply-crisis.spec.ts` 两项通过；既有 `game.spec.ts` 与 `chapter.spec.ts` 共三项通过。首次专项运行有一次测试定位器同时匹配两处文字，收窄后复跑通过。截图 [supply-crisis.png](evidence/supply-crisis.png) 已目视检查。
- `npm run validate:crisis` 以正常命令推进，测试商会、守望者和不回应三种选择，各配守望/商路两种策略，种子 101、202、303、404、505、606、707、808 及新留出 9917、12041，共 60 局。六组各 10 局均取得各自路线结局、无失败命令；不回应均在第 15 日自动保留。结果逐局见 [supply-crisis-sim.jsonl](evidence/supply-crisis-sim.jsonl)。这验证原成功路线在这些种子上仍可走通，不代表对全部种子或其他策略的平衡结论。
