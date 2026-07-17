import type { RequestContext } from '../../common/request-context.js';
import type {
  ContractDetail, ContractPage, ContractQuery, CurrentUserSummary, EmployeePage, EmployeeQuery,
  EmployeeSummary, Id, PostPage, PostQuery, PostSummary, SalaryDetail, SalaryPage, SalaryQuery
} from './erp.types.js';

export const ERP_READ_GATEWAY = Symbol('ERP_READ_GATEWAY');

export interface ErpReadGateway {
  getCurrentUser(context: RequestContext): Promise<CurrentUserSummary>;
  searchEmployees(input: EmployeeQuery, context: RequestContext): Promise<EmployeePage>;
  getEmployee(id: Id, context: RequestContext): Promise<EmployeeSummary>;
  searchContracts(input: ContractQuery, context: RequestContext, todo?: boolean): Promise<ContractPage>;
  getContractTodoCount(context: RequestContext): Promise<{ todoCount: number }>;
  getContractDetail(employeeId: Id, context: RequestContext): Promise<ContractDetail>;
  searchSalary(input: SalaryQuery, context: RequestContext): Promise<SalaryPage>;
  getSalaryDetail(employeeId: Id, context: RequestContext): Promise<SalaryDetail>;
  searchPosts(input: PostQuery, context: RequestContext): Promise<PostPage>;
  getPost(postId: Id, context: RequestContext): Promise<PostSummary>;
}
