# 资料记录

访问日期：2026-11-07（香港时间）。以下为实际读取过的资料；不是对所列项目代码的复制。

- [AI Town 架构](https://github.com/a16z-infra/ai-town/blob/main/ARCHITECTURE.md)：权威世界、输入与异步工作分开；本作使用 Worker 命令和状态快照。
- [Generative Agents 论文](https://arxiv.org/abs/2304.03442)：观察、经历与计划的结构；本作将事件来源、时间和重要性保存在角色记忆中，并不复现论文的语言模型架构。
- [Red Blob A* 入门](https://www.redblobgames.com/pathfinding/a-star/introduction.html)：地图是节点和连接构成的图，不可达需要显式处理。路径实现及接入情况见验证记录。
- [Vite 官方指南](https://vite.dev/guide/)：开发服务器和静态构建、Node 版本要求。项目脚本使用 Vite。
- [PixiJS Application 官方文档](https://github.com/pixijs/pixijs.com/blob/b484dd77b792b04afb949e6cfd1218b3710354cf/docs/guides/components/application/index.md)：v8 异步初始化和渲染器配置。指定的性能页检索时未返回可读正文，不称其已读。
- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)：事务式结构化存储。
- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)：后台线程和消息通信。
- [Vitest 指南](https://vitest.dev/guide/) 与 [Playwright 介绍](https://playwright.dev/docs/intro)：测试入口。
- 模型服务文档与协议测试详见 [server/README.md](../server/README.md)。

全部像素素材为项目生成的原创图集，生成方式和坐标见 [ART.md](ART.md)。项目依赖的许可见各包发布信息；未复制上述参考项目代码。
- [AI Town 项目主页](https://github.com/a16z-infra/ai-town)：观察闲置暂停与运维入口；本项目不使用其后端或代码。
- [Generative Agents 研究实现](https://github.com/joonspk-research/generative_agents)：观察作者的初始记忆流格式；本作仅采用自有事件记录结构。
- [Vite 静态部署指南](https://vite.dev/guide/static-deploy)：以构建产物和预览服务验证，无需部署到外网。
- GitHub CLI 的 [认证检查](https://cli.github.com/manual/gh_auth_status)、[创建仓库](https://cli.github.com/manual/gh_repo_create) 与 [查看仓库](https://cli.github.com/manual/gh_repo_view)：核对实际账户、私有创建和远端元数据。
- 2026-11-07 阅读 GitHub 官方 [Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 与 [发布源设置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)：使用 Actions 构建、上传静态产物并以 `github-pages` 环境发布。
