import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../../config/app-config.service.js';
import type { ErpCredentialProvider } from './erp-credential.provider.js';
import { appendAllowedQuery, ErpHttpClient } from './erp-http.client.js';

afterEach(() => vi.unstubAllGlobals());

describe('ERP query serialization', () => {
  it('preserves a base path and serializes arrays with indexed keys', () => {
    const url = new URL('http://localhost:8080/prod-api/oa/staffInfo/list');
    appendAllowedQuery(url, { deptIds: [100, 101], employmentStatusList: ['1'], empty: '', missing: undefined });
    expect(url.pathname).toBe('/prod-api/oa/staffInfo/list');
    expect(url.searchParams.get('deptIds[0]')).toBe('100');
    expect(url.searchParams.get('deptIds[1]')).toBe('101');
    expect(url.searchParams.get('employmentStatusList[0]')).toBe('1');
    expect(url.searchParams.has('empty')).toBe(false);
    expect(url.searchParams.has('missing')).toBe(false);
  });

  it('uses the real employmentStatus parameter and accepts nullable ERP fields', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      code: 200,
      rows: [{ id: 7, staffName: '虚构员工', resignationDate: null, staffPhone: 'test-phone' }],
      total: 1
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const config = {
      getErpConfig: () => ({
        baseUrl: new URL('http://localhost:8080/prod-api/'), accessToken: 'test-token',
        clientId: 'test-client', language: 'zh-CN', timeoutMs: 1_000
      })
    } as AppConfigService;
    const credentialProvider: ErpCredentialProvider = {
      getCredential: async () => ({ accessToken: 'test-token' })
    };
    const result = await new ErpHttpClient(config, credentialProvider).searchEmployees({
      employmentStatusList: ['1'], pageNum: 1, pageSize: 10
    }, { requestId: 'test-request' });

    const calledUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe('/prod-api/oa/staffInfo/list');
    expect(calledUrl.searchParams.get('employmentStatus')).toBe('1');
    expect(calledUrl.searchParams.has('employmentStatusList[0]')).toBe(false);
    expect(result.items).toEqual([{ id: 7, staffName: '虚构员工' }]);
  });
});
