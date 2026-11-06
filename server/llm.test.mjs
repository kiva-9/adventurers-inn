import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProxy } from './llm.mjs';

const input = { context: { character: '白露', personality: '谨慎', facts: ['今天下雨'], allowedActions: [{ id: 'ask', label: '询问' }] }, message: '你好' };

async function withProxy(options, run) {
  const server = createProxy(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/dialogue`;
  try { await run(url); } finally { await new Promise(resolve => server.close(resolve)); }
}
const post = (url, body = input, headers = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
const response = object => new Response(JSON.stringify({ message: { content: JSON.stringify(object) } }), { status: 200 });

test('simulated Ollama: valid reply follows fixed documented API and never executes the suggestion', async () => {
  let calls = 0;
  await withProxy({ model: 'test-only', fetchImpl: async (url, init) => {
    calls++;
    assert.equal(url, 'http://127.0.0.1:11434/api/chat');
    const request = JSON.parse(init.body);
    assert.equal(request.stream, false);
    assert.equal(request.model, 'test-only');
    return response({ text: '今天雨很大。', suggestedAction: 'ask' });
  } }, async url => {
    const res = await post(url);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { text: '今天雨很大。', suggestedAction: 'ask' });
    assert.equal(calls, 1);
  });
});

test('unconfigured, invalid action and additional state-changing fields are rejected', async () => {
  await withProxy({ model: '', fetchImpl: async () => { throw Error('must not call'); } }, async url => assert.equal((await post(url)).status, 503));
  for (const result of [{ text: '金币到账', suggestedAction: 'give_money' }, { text: '好了', suggestedAction: null, gold: 100 }]) {
    await withProxy({ model: 'test-only', fetchImpl: async () => response(result) }, async url => assert.equal((await post(url)).status, 502));
  }
});

test('invalid request and non-local origins are refused', async () => {
  await withProxy({ model: 'test-only' }, async url => {
    assert.equal((await post(url, { message: 'hello' })).status, 400);
    assert.equal((await post(url, input, { Origin: 'https://example.com' })).status, 403);
  });
});

test('concurrency limit and timeout release the slot', async () => {
  let calls = 0;
  await withProxy({ model: 'test-only', timeoutMs: 100, fetchImpl: async (_url, init) => {
    calls++;
    if (calls > 1) return response({ text: '你好', suggestedAction: null });
    return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(Error('aborted')), { once: true }));
  } }, async url => {
    const first = post(url);
    while (calls === 0) await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal((await post(url)).status, 429);
    assert.equal((await first).status, 502);
    assert.equal((await post(url)).status, 200);
  });
});
