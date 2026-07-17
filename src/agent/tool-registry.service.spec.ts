import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ErpReadGateway } from '../erp/domain/erp-read.gateway.js';
import { AppConfigService } from '../config/app-config.service.js';
import { ToolRegistryService, contractToolSchema, employeeToolSchema } from './tool-registry.service.js';

const gateway: ErpReadGateway = {
  getCurrentUser: vi.fn(), searchEmployees: vi.fn(), getEmployee: vi.fn(), searchContracts: vi.fn(),
  getContractTodoCount: vi.fn(), getContractDetail: vi.fn(), searchSalary: vi.fn(), getSalaryDetail: vi.fn(),
  searchPosts: vi.fn(), getPost: vi.fn()
};

afterEach(() => vi.unstubAllEnvs());

describe('tool registry', () => {
  it('does not register the salary tool by default', () => {
    vi.stubEnv('ENABLE_SALARY_TOOL', '');
    const tools = new ToolRegistryService(new AppConfigService(), gateway).createTools({ requestId: 'test-request' });
    expect(Object.keys(tools)).toContain('getCurrentUser');
    expect(Object.keys(tools)).not.toContain('querySalary');
  });

  it('enforces paging and detail input boundaries', () => {
    expect(employeeToolSchema.safeParse({ pageNum: 1, pageSize: 21 }).success).toBe(false);
    expect(contractToolSchema.safeParse({ mode: 'detail', pageNum: 1, pageSize: 10 }).success).toBe(false);
    expect(contractToolSchema.safeParse({ mode: 'detail', employeeId: 7, pageNum: 1, pageSize: 10 }).success).toBe(true);
  });
});
