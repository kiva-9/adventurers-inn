# 可选的本机模型对话代理

默认游戏无需启动此服务。此代理只连接固定的 `http://127.0.0.1:11434/api/chat`（本机 Ollama），不提供任意 URL 转发；代理自身仅监听 `127.0.0.1:4174`。先自行安装并启动 Ollama、准备一个已安装的模型，然后设置环境变量并运行：

```powershell
$env:INN_OLLAMA_MODEL = '你本机已安装的模型名'
node server/llm.mjs
```

模型名称没有默认值，空值时代理返回不可用。无需在浏览器、存档或仓库放置密钥。服务最多同时处理一个请求，18 秒超时，输出限制为 300 tokens 和 600 字符；浏览器适配器单局默认 12 次，20 秒超时。网络、模型、格式错误或预算耗尽均应显示提示并继续离线对话。代理不会写世界状态：建议 ID 只用于显示一个可选操作，游戏必须在点击时重新通过世界引擎验证。

运行 `node --test server/llm.test.mjs` 可执行标注为模拟服务的协议测试。真实 Ollama 服务和模型是否验证，请参阅项目验收记录。

接口参考：2026-11-07 实际阅读 [Ollama chat API](https://docs.ollama.com/api/chat) 和 [structured outputs](https://docs.ollama.com/capabilities/structured-outputs)：使用非流式 `POST /api/chat`、`format` JSON schema、`message.content`；模型输出仍须本地验证。
