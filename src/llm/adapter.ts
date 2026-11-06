/** Optional presentation layer. This module never mutates the authoritative world. */
export interface DialogueContext {
  character: string;
  personality: string;
  /** Only facts this character is allowed to know. Build this from engine visibility rules. */
  facts: string[];
  /** IDs correspond to currently available engine commands, never arbitrary model actions. */
  allowedActions: { id: string; label: string }[];
}

export type DialogueResult =
  | { ok: true; text: string; suggestedAction: string | null }
  | { ok: false; reason: 'disabled' | 'budget' | 'busy' | 'unavailable' | 'invalid' | 'stale' | 'timeout' };

export class EnhancedDialogue {
  private generation = 0;
  private active: AbortController | null = null;
  private remaining: number;
  private enabled = false;

  constructor(private readonly budget = 12, private readonly timeoutMs = 20_000) {
    this.remaining = Math.max(0, Math.floor(budget));
  }

  get requestsRemaining(): number { return this.remaining; }
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.invalidate();
  }
  /** Invoke on new game, load, scene change, or unmount; late replies are discarded. */
  invalidate(): void {
    this.generation++;
    this.active?.abort();
    this.active = null;
  }
  reset(): void {
    this.invalidate();
    this.remaining = Math.max(0, Math.floor(this.budget));
  }

  async ask(context: DialogueContext, message: string): Promise<DialogueResult> {
    if (!this.enabled) return { ok: false, reason: 'disabled' };
    if (!this.remaining) return { ok: false, reason: 'budget' };
    if (this.active) return { ok: false, reason: 'busy' };
    if (!message.trim() || message.length > 500) return { ok: false, reason: 'invalid' };
    this.remaining--;
    const generation = this.generation;
    const controller = new AbortController();
    this.active = controller;
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
    try {
      const response = await fetch('http://127.0.0.1:4174/dialogue', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, message }), signal: controller.signal,
      });
      if (generation !== this.generation) return { ok: false, reason: 'stale' };
      if (!response.ok) return { ok: false, reason: 'unavailable' };
      const data: unknown = await response.json();
      if (generation !== this.generation) return { ok: false, reason: 'stale' };
      if (!isResponse(data, context.allowedActions)) return { ok: false, reason: 'invalid' };
      return { ok: true, text: data.text, suggestedAction: data.suggestedAction };
    } catch {
      if (generation !== this.generation) return { ok: false, reason: 'stale' };
      return { ok: false, reason: timedOut ? 'timeout' : 'unavailable' };
    } finally {
      clearTimeout(timer);
      if (this.active === controller) this.active = null;
    }
  }
}

function isResponse(value: unknown, actions: DialogueContext['allowedActions']): value is { text: string; suggestedAction: string | null } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some(key => key !== 'text' && key !== 'suggestedAction')) return false;
  return typeof data.text === 'string' && data.text.trim().length > 0 && data.text.length <= 600 &&
    (data.suggestedAction === null || (typeof data.suggestedAction === 'string' && actions.some(action => action.id === data.suggestedAction)));
}
