import { Injectable } from '@nestjs/common';
import { generateText } from 'ai';
import { AppError } from '../common/errors/app-error.js';
import { ModelFactory } from './model.factory.js';

@Injectable()
export class ModelService {
  constructor(private readonly factory: ModelFactory) {}

  async testConnection(signal?: AbortSignal): Promise<{ connected: true }> {
    const { model, timeoutMs } = this.factory.create();
    try {
      await generateText({
        model,
        prompt: '只回复 OK',
        maxOutputTokens: 4,
        maxRetries: 0,
        timeout: timeoutMs,
        ...(signal ? { abortSignal: signal } : {})
      });
      return { connected: true };
    } catch (error) {
      if (signal?.aborted) throw new AppError('MODEL_TIMEOUT', { cause: error });
      throw new AppError('MODEL_UPSTREAM_ERROR', { cause: error });
    }
  }
}
