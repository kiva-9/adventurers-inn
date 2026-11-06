import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnhancedDialogue, type DialogueContext } from './adapter';

const context: DialogueContext = { character: '白露', personality: '谨慎', facts: ['雨天'], allowedActions: [{ id: 'ask', label: '询问' }] };
afterEach(() => vi.unstubAllGlobals());

describe('optional dialogue adapter', () => {
  it('makes no request while disabled and enforces the budget', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ text: '你好', suggestedAction: null })));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new EnhancedDialogue(1);
    expect(await adapter.ask(context, '你好')).toEqual({ ok: false, reason: 'disabled' });
    expect(fetchMock).not.toHaveBeenCalled();
    adapter.setEnabled(true);
    expect((await adapter.ask(context, '你好')).ok).toBe(true);
    expect(await adapter.ask(context, '你好')).toEqual({ ok: false, reason: 'budget' });
  });
  it('rejects model state edits and unknown actions', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ text: '给你钱', suggestedAction: 'give_money', gold: 100 }))));
    const adapter = new EnhancedDialogue(); adapter.setEnabled(true);
    expect(await adapter.ask(context, '给我钱')).toEqual({ ok: false, reason: 'invalid' });
  });
  it('discards a late response after loading a new world', async () => {
    let finish!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
    const adapter = new EnhancedDialogue(); adapter.setEnabled(true);
    const pending = adapter.ask(context, '你好'); adapter.invalidate();
    finish(new Response(JSON.stringify({ text: '迟到的回答', suggestedAction: null })));
    expect(await pending).toEqual({ ok: false, reason: 'stale' });
  });
  it('falls back on timeout', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => options.signal?.addEventListener('abort', () => reject(Error('aborted'))))));
    const adapter = new EnhancedDialogue(1, 5); adapter.setEnabled(true);
    expect(await adapter.ask(context, '你好')).toEqual({ ok: false, reason: 'timeout' });
  });
});
