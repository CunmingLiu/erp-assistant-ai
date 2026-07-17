import { Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import { AppError } from '../common/errors/app-error.js';
import { appEnvSchema, erpEnvSchema, modelEnvSchema, type AppEnv } from './env.schema.js';

export interface ErpConfig {
  baseUrl: URL;
  accessToken: string;
  clientId: string;
  language: string;
  timeoutMs: number;
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs: number;
}

@Injectable()
export class AppConfigService {
  readonly app: AppEnv;

  constructor() {
    this.app = appEnvSchema.parse(process.env);
  }

  getErpConfig(): ErpConfig {
    try {
      const value = erpEnvSchema.parse(process.env);
      const baseUrl = new URL(value.ERP_BASE_URL);
      if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
        throw new Error('Invalid ERP URL');
      }
      const allowedHosts = value.ERP_ALLOWED_HOSTS.split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
      if (!allowedHosts.includes(baseUrl.hostname.toLowerCase())) throw new Error('ERP host is not allowed');
      return {
        baseUrl,
        accessToken: value.ERP_ACCESS_TOKEN,
        clientId: value.ERP_CLIENT_ID,
        language: value.ERP_LANGUAGE,
        timeoutMs: value.ERP_REQUEST_TIMEOUT_MS
      };
    } catch (error) {
      throw new AppError('ERP_CONFIG_ERROR', { cause: error });
    }
  }

  getModelConfig(): ModelConfig {
    try {
      const value = modelEnvSchema.parse(process.env);
      const apiKey = value.AI_PROVIDER_API_KEY || (value.AI_PROVIDER === 'openai'
        ? value.OPENAI_API_KEY
        : value.ANTHROPIC_AUTH_TOKEN || value.ANTHROPIC_API_KEY);
      if (!apiKey) throw new Error('Model key is missing');
      const configuredUrl = value.AI_PROVIDER_BASE_URL || (value.AI_PROVIDER === 'anthropic' ? value.ANTHROPIC_BASE_URL : undefined);
      let baseUrl: string | undefined;
      if (configuredUrl) {
        const url = new URL(configuredUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
          throw new Error('Invalid model URL');
        }
        baseUrl = url.toString().replace(/\/$/, '');
      }
      return {
        provider: value.AI_PROVIDER,
        apiKey,
        model: value.AI_MODEL,
        ...(baseUrl ? { baseUrl } : {}),
        timeoutMs: value.MODEL_REQUEST_TIMEOUT_MS
      };
    } catch (error) {
      const cause = error instanceof ZodError ? error : error;
      throw new AppError('MODEL_CONFIG_ERROR', { cause });
    }
  }
}
