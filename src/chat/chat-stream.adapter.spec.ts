import { describe, expect, it } from 'vitest';
import { encodeSse } from './chat-stream.adapter.js';

describe('SSE adapter', () => {
  it('emits a complete public event without tool input or results', () => {
    const value = encodeSse({ event: 'tool-status', data: { tool: 'queryEmployees', status: 'started' } });
    expect(value).toBe('event: tool-status\ndata: {"tool":"queryEmployees","status":"started"}\n\n');
    expect(value).not.toContain('staffName');
  });
});
