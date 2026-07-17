import { describe, expect, it } from 'vitest';
import { employeeRawSchema, postRawSchema, salaryRawSchema } from './erp-raw.schemas.js';
import { sanitizeEmployee, sanitizePost, sanitizeSalary } from './erp-sanitizers.js';

describe('ERP field allowlists', () => {
  it('keeps employee business fields and drops personal fields', () => {
    const raw = employeeRawSchema.parse({
      id: 7, staffName: '虚构员工', deptName: '测试部', resignationDate: null,
      idCard: 'test-id-card', staffPhone: 'test-phone', bankCardNo: 'test-bank-card', presentAddress: 'test-address'
    });
    const result = sanitizeEmployee(raw);
    expect(result).toEqual({ id: 7, staffName: '虚构员工', deptName: '测试部' });
    expect(JSON.stringify(result)).not.toMatch(/idCard|staffPhone|bankCardNo|presentAddress/);
  });

  it('only accepts the confirmed salary field names', () => {
    const raw = salaryRawSchema.parse({
      staffName: '虚构员工', baseSalary: '100', basePay: 'should-not-pass', bankName: 'test-bank'
    });
    const result = sanitizeSalary(raw);
    expect(result.baseSalary).toBe('100');
    expect(JSON.stringify(result)).not.toMatch(/basePay|bankName/);
  });

  it('maps only public post fields', () => {
    const result = sanitizePost(postRawSchema.parse({ postId: 1, postName: '测试岗位', secret: 'hidden' }));
    expect(result).toEqual({ postId: 1, postName: '测试岗位' });
  });
});
