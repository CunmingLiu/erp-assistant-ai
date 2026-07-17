import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../common/errors/app-error.js';
import { AppConfigService } from './app-config.service.js';

afterEach(() => vi.unstubAllEnvs());

describe('AppConfigService', () => {
  it('applies safe application defaults without requiring external credentials', () => {
    vi.stubEnv('API_PORT', '');
    vi.stubEnv('ENABLE_SALARY_TOOL', '');
    const config = new AppConfigService();
    expect(config.app.API_PORT).toBe(3001);
    expect(config.app.ENABLE_SALARY_TOOL).toBe(false);
  });

  it('rejects an ERP host outside the allowlist', () => {
    vi.stubEnv('ERP_BASE_URL', 'https://erp.invalid/prod-api/');
    vi.stubEnv('ERP_ACCESS_TOKEN', 'test-token');
    vi.stubEnv('ERP_CLIENT_ID', 'test-client');
    vi.stubEnv('ERP_ALLOWED_HOSTS', 'localhost');
    const config = new AppConfigService();
    try {
      config.getErpConfig();
      throw new Error('Expected ERP config validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('ERP_CONFIG_ERROR');
    }
  });

  it('selects the dedicated model key before the provider fallback key', () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('AI_PROVIDER_API_KEY', 'dedicated-test-key');
    vi.stubEnv('OPENAI_API_KEY', 'fallback-test-key');
    const config = new AppConfigService();
    expect(config.getModelConfig().apiKey).toBe('dedicated-test-key');
  });
});
