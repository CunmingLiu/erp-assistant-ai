import { describe, expect, it, vi } from 'vitest';
import type { AppConfigService, ModelConfig } from '../config/app-config.service.js';

const mocks = vi.hoisted(() => {
  const responsesModel = { provider: 'test.responses' };
  const chatModel = { provider: 'test.chat' };
  const provider = Object.assign(vi.fn(() => responsesModel), { chat: vi.fn(() => chatModel) });
  return { responsesModel, chatModel, provider };
});

vi.mock('@ai-sdk/openai', () => ({ createOpenAI: vi.fn(() => mocks.provider) }));
vi.mock('@ai-sdk/anthropic', () => ({ createAnthropic: vi.fn() }));

import { ModelFactory } from './model.factory.js';

function config(value: ModelConfig): AppConfigService {
  return { getModelConfig: () => value } as AppConfigService;
}

describe('ModelFactory', () => {
  it('uses Chat Completions for a custom OpenAI-compatible base URL', () => {
    const result = new ModelFactory(config({
      provider: 'openai', apiKey: 'test-key', model: 'test-model',
      baseUrl: 'https://compatible.invalid/v1', timeoutMs: 1_000
    })).create();
    expect(result.model).toBe(mocks.chatModel);
    expect(mocks.provider.chat).toHaveBeenCalledWith('test-model');
  });

  it('keeps the default Responses API for the official OpenAI endpoint', () => {
    const result = new ModelFactory(config({
      provider: 'openai', apiKey: 'test-key', model: 'test-model', timeoutMs: 1_000
    })).create();
    expect(result.model).toBe(mocks.responsesModel);
  });
});
