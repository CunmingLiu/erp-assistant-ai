import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { RequestContext } from '../../common/request-context.js';
import { AppError } from '../../common/errors/app-error.js';
import { AppConfigService } from '../../config/app-config.service.js';
import type { ErpReadGateway } from '../domain/erp-read.gateway.js';
import type {
  ContractDetail, ContractPage, ContractQuery, CurrentUserSummary, EmployeePage, EmployeeQuery,
  EmployeeSummary, Id, PostPage, PostQuery, PostSummary, SalaryDetail, SalaryPage, SalaryQuery
} from '../domain/erp.types.js';
import { ERP_CREDENTIAL_PROVIDER, type ErpCredentialProvider } from './erp-credential.provider.js';
import {
  changeRecordRawSchema, contractRawSchema, contractRecordRawSchema, countEnvelopeSchema,
  currentUserEnvelopeSchema, dataEnvelopeSchema, educationRecordRawSchema, employeeRawSchema,
  listEnvelopeSchema, postRawSchema, salaryRawSchema, salaryRecordRawSchema
} from './erp-raw.schemas.js';
import {
  sanitizeChangeRecord, sanitizeContract, sanitizeContractRecord, sanitizeCurrentUser,
  sanitizeEducationRecord, sanitizeEmployee, sanitizePost, sanitizeSalary, sanitizeSalaryRecord
} from './erp-sanitizers.js';

const ERP_PATHS = {
  currentUser: 'system/user/getInfo',
  employees: 'oa/staffInfo/list',
  employee: 'oa/staffInfo/',
  contracts: 'oa/staffInfo/contracts/list',
  contractTodos: 'oa/staffInfo/listForLaborToDo',
  contractCount: 'oa/staffInfo/contracts/handleCount',
  contractDetail: 'oa/staffInfo/labor/',
  salary: 'oa/staffInfo/listForSalary',
  salaryDetail: 'oa/staffInfo/salary/',
  posts: 'hr/post/list',
  post: 'hr/post/'
} as const;

type QueryValue = string | number | Array<string | number> | undefined;

export function appendAllowedQuery(url: URL, query: Record<string, QueryValue>): void {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((item, index) => url.searchParams.append(`${key}[${index}]`, String(item)));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
}

@Injectable()
export class ErpHttpClient implements ErpReadGateway {
  constructor(
    private readonly config: AppConfigService,
    @Inject(ERP_CREDENTIAL_PROVIDER) private readonly credentialProvider: ErpCredentialProvider
  ) {}

  async getCurrentUser(context: RequestContext): Promise<CurrentUserSummary> {
    const raw = currentUserEnvelopeSchema.safeParse(await this.request(ERP_PATHS.currentUser, {}, context));
    if (!raw.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: raw.error });
    return sanitizeCurrentUser(raw.data);
  }

  async searchEmployees(input: EmployeeQuery, context: RequestContext): Promise<EmployeePage> {
    const parsed = listEnvelopeSchema(employeeRawSchema).safeParse(await this.request(ERP_PATHS.employees, this.employeeQuery(input), context));
    if (!parsed.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: parsed.error });
    return { items: parsed.data.rows.map(sanitizeEmployee), total: parsed.data.total, pageNum: input.pageNum, pageSize: input.pageSize };
  }

  async getEmployee(id: Id, context: RequestContext): Promise<EmployeeSummary> {
    const envelope = dataEnvelopeSchema(z.unknown()).safeParse(await this.request(`${ERP_PATHS.employee}${encodeURIComponent(String(id))}`, {}, context));
    if (!envelope.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: envelope.error });
    const record = z.record(z.string(), z.unknown()).safeParse(envelope.data.data);
    if (!record.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: record.error });
    const candidate = employeeRawSchema.safeParse(record.data.oaStaffInfoVo ?? record.data);
    if (!candidate.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: candidate.error });
    const education = z.array(educationRecordRawSchema).safeParse(record.data.oaEducationlist ?? []);
    const changes = z.array(changeRecordRawSchema).safeParse(record.data.oaPostRecordlist ?? []);
    if (!education.success || !changes.success) {
      throw new AppError('ERP_INVALID_RESPONSE', { cause: education.error ?? changes.error });
    }
    return {
      ...sanitizeEmployee(candidate.data),
      educationRecords: education.data.map(sanitizeEducationRecord),
      changeRecords: changes.data.map(sanitizeChangeRecord)
    };
  }

  async searchContracts(input: ContractQuery, context: RequestContext, todo = false): Promise<ContractPage> {
    const path = todo ? ERP_PATHS.contractTodos : ERP_PATHS.contracts;
    const parsed = listEnvelopeSchema(contractRawSchema).safeParse(await this.request(path, this.contractQuery(input), context));
    if (!parsed.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: parsed.error });
    return { items: parsed.data.rows.map(sanitizeContract), total: parsed.data.total, pageNum: input.pageNum, pageSize: input.pageSize };
  }

  async getContractTodoCount(context: RequestContext): Promise<{ todoCount: number }> {
    const parsed = countEnvelopeSchema.safeParse(await this.request(ERP_PATHS.contractCount, {}, context));
    if (!parsed.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: parsed.error });
    return parsed.data.data;
  }

  async getContractDetail(employeeId: Id, context: RequestContext): Promise<ContractDetail> {
    const envelope = dataEnvelopeSchema(z.unknown()).safeParse(await this.request(`${ERP_PATHS.contractDetail}${encodeURIComponent(String(employeeId))}`, {}, context));
    if (!envelope.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: envelope.error });
    const record = z.record(z.string(), z.unknown()).safeParse(envelope.data.data);
    if (!record.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: record.error });
    const candidate = contractRawSchema.safeParse(record.data.oaStaffInfoLaborVo ?? record.data.oaStaffInfoVo ?? record.data);
    if (!candidate.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: candidate.error });
    const records = z.array(contractRecordRawSchema).safeParse(record.data.oaLaborRelationVoList ?? []);
    if (!records.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: records.error });
    return { ...sanitizeContract(candidate.data), contractRecords: records.data.map(sanitizeContractRecord) };
  }

  async searchSalary(input: SalaryQuery, context: RequestContext): Promise<SalaryPage> {
    const parsed = listEnvelopeSchema(salaryRawSchema).safeParse(await this.request(ERP_PATHS.salary, this.employeeQuery(input), context));
    if (!parsed.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: parsed.error });
    return { items: parsed.data.rows.map(sanitizeSalary), total: parsed.data.total, pageNum: input.pageNum, pageSize: input.pageSize };
  }

  async getSalaryDetail(employeeId: Id, context: RequestContext): Promise<SalaryDetail> {
    const envelope = dataEnvelopeSchema(z.unknown()).safeParse(await this.request(`${ERP_PATHS.salaryDetail}${encodeURIComponent(String(employeeId))}`, {}, context));
    if (!envelope.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: envelope.error });
    const record = z.record(z.string(), z.unknown()).safeParse(envelope.data.data);
    if (!record.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: record.error });
    const candidate = salaryRawSchema.safeParse(record.data.oaStaffInfoSalaryVo ?? record.data.oaStaffInfoVo ?? record.data);
    if (!candidate.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: candidate.error });
    const records = z.array(salaryRecordRawSchema).safeParse(record.data.oaSalaryRecordlist ?? []);
    if (!records.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: records.error });
    return { ...sanitizeSalary(candidate.data), salaryRecords: records.data.map(sanitizeSalaryRecord) };
  }

  async searchPosts(input: PostQuery, context: RequestContext): Promise<PostPage> {
    const parsed = listEnvelopeSchema(postRawSchema).safeParse(await this.request(ERP_PATHS.posts, {
      postCode: input.postCode, postName: input.postName, postCategory: input.postCategory,
      postLevel: input.postLevel, status: input.status, pageNum: input.pageNum, pageSize: input.pageSize
    }, context));
    if (!parsed.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: parsed.error });
    return { items: parsed.data.rows.map(sanitizePost), total: parsed.data.total, pageNum: input.pageNum, pageSize: input.pageSize };
  }

  async getPost(postId: Id, context: RequestContext): Promise<PostSummary> {
    const parsed = dataEnvelopeSchema(postRawSchema).safeParse(await this.request(`${ERP_PATHS.post}${encodeURIComponent(String(postId))}`, {}, context));
    if (!parsed.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: parsed.error });
    return sanitizePost(parsed.data.data);
  }

  private employeeQuery(input: EmployeeQuery): Record<string, QueryValue> {
    return {
      staffName: input.staffName, staffNo: input.staffNo, postName: input.postName, deptIds: input.deptIds,
      employmentStatus: input.employmentStatusList?.[0], positionLevel: input.positionLevel,
      workplaceCity: input.workplaceCity, pageNum: input.pageNum, pageSize: input.pageSize
    };
  }

  private contractQuery(input: ContractQuery): Record<string, QueryValue> {
    return { ...this.employeeQuery(input), contractType: input.contractType };
  }

  private async request(path: string, query: Record<string, QueryValue>, context: RequestContext): Promise<unknown> {
    const config = this.config.getErpConfig();
    const credential = await this.credentialProvider.getCredential(context);
    const base = new URL(config.baseUrl.toString().endsWith('/') ? config.baseUrl : `${config.baseUrl.toString()}/`);
    const url = new URL(path, base);
    appendAllowedQuery(url, query);

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, config.timeoutMs);
    const abortFromCaller = () => controller.abort();
    context.signal?.addEventListener('abort', abortFromCaller, { once: true });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credential.accessToken}`,
          clientid: config.clientId,
          'Content-Language': config.language,
          Accept: 'application/json'
        },
        redirect: 'error',
        signal: controller.signal
      });
      if (response.status === 401 || response.status === 403) throw new AppError('ERP_UNAUTHORIZED');
      if (!response.ok) throw new AppError('ERP_UPSTREAM_ERROR');
      if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
        throw new AppError('ERP_INVALID_RESPONSE');
      }
      const raw: unknown = await response.json();
      const envelope = z.object({ code: z.union([z.string(), z.number()]).optional() }).passthrough().safeParse(raw);
      if (!envelope.success) throw new AppError('ERP_INVALID_RESPONSE', { cause: envelope.error });
      if (envelope.data.code !== undefined && Number(envelope.data.code) !== 200) {
        if ([401, 403].includes(Number(envelope.data.code))) throw new AppError('ERP_UNAUTHORIZED');
        throw new AppError('ERP_UPSTREAM_ERROR');
      }
      return raw;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (timedOut) throw new AppError('ERP_TIMEOUT', { cause: error });
      throw new AppError('ERP_UPSTREAM_ERROR', { cause: error });
    } finally {
      clearTimeout(timeout);
      context.signal?.removeEventListener('abort', abortFromCaller);
    }
  }
}
