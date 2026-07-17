import { Injectable } from '@nestjs/common';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { AppConfigService } from '../config/app-config.service.js';

@Injectable()
export class ModelFactory {
  constructor(private readonly config: AppConfigService) {}

  create() {
    const value = this.config.getModelConfig();
    if (value.provider === 'anthropic') {
      const provider = createAnthropic({ apiKey: value.apiKey, ...(value.baseUrl ? { baseURL: value.baseUrl } : {}) });
      return { model: provider(value.model), timeoutMs: value.timeoutMs };
    }
    const provider = createOpenAI({ apiKey: value.apiKey, ...(value.baseUrl ? { baseURL: value.baseUrl } : {}) });
    // Third-party OpenAI-compatible providers such as DeepSeek generally
    // implement /chat/completions, not OpenAI's newer /responses endpoint.
    const model = value.baseUrl ? provider.chat(value.model) : provider(value.model);
    return { model, timeoutMs: value.timeoutMs };
  }
}
