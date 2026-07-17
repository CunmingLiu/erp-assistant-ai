import type { CurrentUserSummary } from '@erp-assistant/contracts';

export type Id = string | number;

export interface PageQuery {
  pageNum: number;
  pageSize: number;
}

export interface EmployeeQuery extends PageQuery {
  staffName?: string | undefined;
  staffNo?: string | undefined;
  postName?: string | undefined;
  deptIds?: Id[] | undefined;
  employmentStatusList?: string[] | undefined;
  positionLevel?: string | undefined;
  workplaceCity?: string | undefined;
}

export interface ContractQuery extends EmployeeQuery {
  contractType?: string | undefined;
}

export type SalaryQuery = EmployeeQuery;

export interface PostQuery extends PageQuery {
  postCode?: string | undefined;
  postName?: string | undefined;
  postCategory?: string | undefined;
  postLevel?: string[] | undefined;
  status?: string | undefined;
}

export interface EmployeeSummary {
  id?: Id | undefined;
  staffNo?: string | undefined;
  staffName?: string | undefined;
  deptId?: Id | undefined;
  deptName?: string | undefined;
  postId?: Id | undefined;
  postName?: string | undefined;
  position?: string | undefined;
  positionLevel?: string | undefined;
  parentName?: string | undefined;
  workplaceCity?: string | undefined;
  appointmentDate?: string | undefined;
  hireDate?: string | undefined;
  workYears?: string | undefined;
  employmentStatus?: string | undefined;
  educationLevel?: string | undefined;
  educationType?: string | undefined;
  school?: string | undefined;
  profession?: string | undefined;
  certificate?: string | undefined;
  resignationDate?: string | undefined;
  resignationReason?: string | undefined;
  educationRecords?: Array<Record<string, string>> | undefined;
  changeRecords?: Array<Record<string, string>> | undefined;
}

export interface ContractSummary extends EmployeeSummary {
  contractType?: string | undefined;
  contractCount?: string | undefined;
  contractTerm?: string | undefined;
  contractStartDate?: string | undefined;
  contractEndDate?: string | undefined;
  contractRemainingDays?: string | undefined;
  probationPeriod?: string | undefined;
  probationDate?: string | undefined;
  remark?: string | undefined;
  contractRecords?: Array<Record<string, string>> | undefined;
}

export interface SalarySummary extends EmployeeSummary {
  salaryType?: string | undefined;
  changeType?: string | undefined;
  salaryGrade?: string | undefined;
  salaryPoint?: string | undefined;
  salaryStructure?: string | undefined;
  baseSalary?: string | undefined;
  positionSalary?: string | undefined;
  performanceBonus?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  remark?: string | undefined;
  salaryRecords?: Array<Record<string, string>> | undefined;
}

export interface PostSummary {
  postId?: Id | undefined;
  deptId?: Id | undefined;
  postCode?: string | undefined;
  postName?: string | undefined;
  postCategory?: string | undefined;
  postLevel?: string[] | undefined;
  deptName?: string | undefined;
  postSort?: number | undefined;
  status?: string | undefined;
  remark?: string | undefined;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export type EmployeePage = PageResult<EmployeeSummary>;
export type ContractPage = PageResult<ContractSummary>;
export type SalaryPage = PageResult<SalarySummary>;
export type PostPage = PageResult<PostSummary>;
export type ContractDetail = ContractSummary;
export type SalaryDetail = SalarySummary;
export type { CurrentUserSummary };
