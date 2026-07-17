import { Inject, Injectable } from '@nestjs/common';
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import type { RequestContext } from '../common/request-context.js';
import { AppConfigService } from '../config/app-config.service.js';
import { ERP_READ_GATEWAY, type ErpReadGateway } from '../erp/domain/erp-read.gateway.js';

const pageFields = {
  pageNum: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(20).default(10)
};

const employeeFields = {
  employeeId: z.union([z.string(), z.number()]).optional(),
  staffName: z.string().min(1).max(100).optional(),
  staffNo: z.string().min(1).max(100).optional(),
  postName: z.string().min(1).max(100).optional(),
  deptIds: z.array(z.union([z.string(), z.number()])).max(20).optional(),
  employmentStatusList: z.array(z.string().min(1).max(50)).max(20).optional(),
  positionLevel: z.string().min(1).max(100).optional(),
  workplaceCity: z.string().min(1).max(100).optional(),
  ...pageFields
};

export const currentUserToolSchema = z.object({}).strict();
export const employeeToolSchema = z.object(employeeFields).strict();
export const contractToolSchema = z.object({
  mode: z.enum(['list', 'todo', 'count', 'detail']),
  ...employeeFields,
  contractType: z.string().min(1).max(100).optional()
}).strict().superRefine((value, context) => {
  if (value.mode === 'detail' && value.employeeId === undefined) {
    context.addIssue({ code: 'custom', path: ['employeeId'], message: '详情查询必须提供员工 ID' });
  }
});
export const salaryToolSchema = employeeToolSchema;
export const postToolSchema = z.object({
  postId: z.union([z.string(), z.number()]).optional(),
  postCode: z.string().min(1).max(100).optional(),
  postName: z.string().min(1).max(100).optional(),
  postCategory: z.string().min(1).max(100).optional(),
  postLevel: z.array(z.string().min(1).max(100)).max(20).optional(),
  status: z.string().min(1).max(50).optional(),
  ...pageFields
}).strict();

@Injectable()
export class ToolRegistryService {
  constructor(
    private readonly config: AppConfigService,
    @Inject(ERP_READ_GATEWAY) private readonly gateway: ErpReadGateway
  ) {}

  createTools(context: RequestContext): ToolSet {
    const tools: ToolSet = {
      getCurrentUser: tool({
        description: '查询当前 ERP 用户的脱敏账号、部门、角色和权限数量概况',
        inputSchema: currentUserToolSchema,
        execute: async () => this.gateway.getCurrentUser(context)
      })
    };

    if (this.config.app.ENABLE_EMPLOYEE_TOOL) {
      tools.queryEmployees = tool({
        description: '按员工 ID 查询脱敏详情，或按姓名、工号、部门、岗位、职级和在职状态分页查询员工',
        inputSchema: employeeToolSchema,
        execute: async (input) => input.employeeId !== undefined
          ? this.gateway.getEmployee(input.employeeId, context)
          : this.gateway.searchEmployees(input, context)
      });
    }
    if (this.config.app.ENABLE_CONTRACT_TOOL) {
      tools.queryContracts = tool({
        description: '查询合同列表、合同待办、待办数量或指定员工的合同详情',
        inputSchema: contractToolSchema,
        execute: async (input) => {
          if (input.mode === 'count') return this.gateway.getContractTodoCount(context);
          if (input.mode === 'detail') return this.gateway.getContractDetail(input.employeeId as string | number, context);
          const { mode: _mode, employeeId: _employeeId, ...query } = input;
          return this.gateway.searchContracts(query, context, input.mode === 'todo');
        }
      });
    }
    if (this.config.app.ENABLE_SALARY_TOOL) {
      tools.querySalary = tool({
        description: '仅在用户明确询问薪资、工资、薪级、薪点或奖金时查询脱敏薪酬信息',
        inputSchema: salaryToolSchema,
        execute: async (input) => input.employeeId !== undefined
          ? this.gateway.getSalaryDetail(input.employeeId, context)
          : this.gateway.searchSalary(input, context)
      });
    }
    if (this.config.app.ENABLE_POST_TOOL) {
      tools.queryPosts = tool({
        description: '按岗位 ID 查询详情，或按岗位编码、名称、类别、级别和状态分页查询岗位',
        inputSchema: postToolSchema,
        execute: async (input) => input.postId !== undefined
          ? this.gateway.getPost(input.postId, context)
          : this.gateway.searchPosts(input, context)
      });
    }
    return tools;
  }
}
