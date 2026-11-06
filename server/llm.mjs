import http from 'node:http';
import { pathToFileURL } from 'node:url';

const MAX_BODY = 16_384;
const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
const schema = {
  type: 'object', additionalProperties: false,
  properties: { text: { type: 'string' }, suggestedAction: { anyOf: [{ type: 'string' }, { type: 'null' }] } },
  required: ['text', 'suggestedAction'],
};

function validInput(data) {
  const c = data?.context;
  const bounded = (s, n) => typeof s === 'string' && s.length > 0 && s.length <= n;
  return !!c && bounded(c.character, 80) && bounded(c.personality, 500) &&
    Array.isArray(c.facts) && c.facts.length <= 20 && c.facts.every(s => bounded(s, 300)) &&
    Array.isArray(c.allowedActions) && c.allowedActions.length <= 12 &&
    c.allowedActions.every(a => a && bounded(a.id, 80) && bounded(a.label, 120)) &&
    bounded(data.message, 500);
}

function validOutput(out, actions) {
  return out && typeof out === 'object' && !Array.isArray(out) &&
    Object.keys(out).every(k => k === 'text' || k === 'suggestedAction') &&
    typeof out.text === 'string' && out.text.trim().length > 0 && out.text.length <= 600 &&
    (out.suggestedAction === null || (typeof out.suggestedAction === 'string' && actions.some(a => a.id === out.suggestedAction)));
}

async function readBody(stream, limit) {
  let size = 0;
  const parts = [];
  for await (const part of stream) {
    size += part.length;
    if (size > limit) throw new Error('too large');
    parts.push(part);
  }
  return Buffer.concat(parts).toString('utf8');
}

/** fetchImpl is injected only by local tests; production always uses the fixed Ollama endpoint. */
export function createProxy({ model = process.env.INN_OLLAMA_MODEL || '', fetchImpl = fetch, timeoutMs = 18_000 } = {}) {
  let active = false;
  return http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      res.writeHead(403).end(); return;
    }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
    const reply = (status, data) => { if (!res.writableEnded && !res.destroyed) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); } };
    if (req.method !== 'POST' || req.url !== '/dialogue') { reply(404, { error: 'not found' }); return; }
    if (!model) { reply(503, { error: 'model not configured' }); return; }
    if (active) { reply(429, { error: 'busy' }); return; }
    active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    res.on('close', () => { if (!res.writableEnded) controller.abort(); });
    try {
      const body = JSON.parse(await readBody(req, MAX_BODY));
      if (!validInput(body)) { reply(400, { error: 'invalid request' }); return; }
      const prompt = `你是游戏中的角色，只能根据以下角色已知信息回答。你的文字不是世界事实；不能声称已经交易、改变关系或完成任务。建议只能从给出的动作 ID 中选择，不确定时用 null。只返回符合格式的 JSON。\n${JSON.stringify(body.context)}`;
      const upstream = await fetchImpl(OLLAMA_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ model, stream: false, format: schema, options: { num_predict: 300, temperature: 0.3 }, messages: [{ role: 'system', content: prompt }, { role: 'user', content: body.message }] }),
      });
      if (!upstream.ok) { reply(502, { error: 'model unavailable' }); return; }
      const raw = await readBody(upstream.body, 65_536);
      const response = JSON.parse(raw);
      const result = JSON.parse(response.message.content);
      if (!validOutput(result, body.context.allowedActions)) { reply(502, { error: 'invalid model response' }); return; }
      reply(200, result);
    } catch {
      reply(502, { error: 'model unavailable or invalid response' });
    } finally {
      clearTimeout(timer);
      active = false;
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = 4174;
  createProxy().listen(port, '127.0.0.1', () => {
    console.log(`归途旅店对话代理：127.0.0.1:${port}；${process.env.INN_OLLAMA_MODEL ? '已指定模型' : '未指定模型，将回退离线模式'}`);
  });
}
