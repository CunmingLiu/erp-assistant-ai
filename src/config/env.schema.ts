import { z } from 'zod';

const booleanFromEnv = (defaultValue: boolean) => z.preprocess(
  (value) => value === undefined || value === '' ? defaultValue : value === 'true',
  z.boolean()
);

export const appEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.coerce.number().int().min(1).max(65_535).default(3001)
  ),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_EMPLOYEE_TOOL: booleanFromEnv(true),
  ENABLE_CONTRACT_TOOL: booleanFromEnv(true),
  ENABLE_SALARY_TOOL: booleanFromEnv(false),
  ENABLE_POST_TOOL: booleanFromEnv(true)
});

export const erpEnvSchema = z.object({
  ERP_BASE_URL: z.url(),
  ERP_ACCESS_TOKEN: z.string().min(1),
  ERP_CLIENT_ID: z.string().min(1),
  ERP_LANGUAGE: z.string().min(2).default('zh-CN'),
  ERP_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(10_000),
  ERP_ALLOWED_HOSTS: z.string().min(1)
});

export const modelEnvSchema = z.object({
  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('openai'),
  AI_PROVIDER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().min(1).default('gpt-4.1-mini'),
  AI_PROVIDER_BASE_URL: z.string().optional(),
  ANTHROPIC_AUTH_TOKEN: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().optional(),
  MODEL_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(28_000)
});

export type AppEnv = z.infer<typeof appEnvSchema>;
export type ErpEnv = z.infer<typeof erpEnvSchema>;
export type ModelEnv = z.infer<typeof modelEnvSchema>;
