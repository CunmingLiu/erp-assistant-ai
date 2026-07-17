import type { CurrentUserSummary } from '@erp-assistant/contracts';
import type { ContractSummary, EmployeeSummary, PostSummary, SalarySummary } from '../domain/erp.types.js';
import type { z } from 'zod';
import type {
  changeRecordRawSchema, contractRawSchema, contractRecordRawSchema, currentUserEnvelopeSchema,
  educationRecordRawSchema, employeeRawSchema, postRawSchema, salaryRawSchema, salaryRecordRawSchema
} from './erp-raw.schemas.js';

function removeUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

type EmployeeRaw = z.infer<typeof employeeRawSchema>;
type ContractRaw = z.infer<typeof contractRawSchema>;
type SalaryRaw = z.infer<typeof salaryRawSchema>;
type PostRaw = z.infer<typeof postRawSchema>;
type EducationRecordRaw = z.infer<typeof educationRecordRawSchema>;
type ChangeRecordRaw = z.infer<typeof changeRecordRawSchema>;
type ContractRecordRaw = z.infer<typeof contractRecordRawSchema>;
type SalaryRecordRaw = z.infer<typeof salaryRecordRawSchema>;

export function sanitizeCurrentUser(raw: z.infer<typeof currentUserEnvelopeSchema>): CurrentUserSummary {
  return {
    userId: raw.data.user.userId,
    tenantId: raw.data.user.tenantId,
    userName: raw.data.user.userName,
    nickName: raw.data.user.nickName,
    department: raw.data.user.deptName ?? '',
    roles: raw.data.roles,
    permissionCount: raw.data.permissions.length,
    admin: raw.data.user.admin,
    status: raw.data.user.status
  };
}

export function sanitizeEmployee(raw: EmployeeRaw): EmployeeSummary {
  return removeUndefined({
    id: raw.id, staffNo: raw.staffNo, staffName: raw.staffName, deptId: raw.deptId, deptName: raw.deptName,
    postId: raw.postId, postName: raw.postName, position: raw.position, positionLevel: raw.positionLevel,
    parentName: raw.parentName, workplaceCity: raw.workplaceCity, appointmentDate: raw.appointmentDate,
    hireDate: raw.hireDate, workYears: raw.workYears, employmentStatus: raw.employmentStatus,
    educationLevel: raw.educationLevel, educationType: raw.educationType, school: raw.school,
    profession: raw.profession, certificate: raw.certificate,
    resignationDate: raw.resignationDate ?? raw.dimissionTime,
    resignationReason: raw.resignationReason ?? raw.dimissionCause
  });
}

export function sanitizeContract(raw: ContractRaw): ContractSummary {
  return removeUndefined({
    ...sanitizeEmployee(raw), contractType: raw.contractType, contractCount: raw.contractCount,
    contractTerm: raw.contractTerm ?? raw.contractCnt, contractStartDate: raw.contractStartDate ?? raw.startTime,
    contractEndDate: raw.contractEndDate ?? raw.endTime, contractRemainingDays: raw.contractRemainingDays,
    probationPeriod: raw.probationPeriod, probationDate: raw.probationDate ?? raw.probationTime,
    remark: raw.remark ?? raw.contractRemark
  });
}

export function sanitizeSalary(raw: SalaryRaw): SalarySummary {
  return removeUndefined({
    ...sanitizeEmployee(raw), salaryType: raw.salaryType, changeType: raw.changeType,
    salaryGrade: raw.salaryGrade, salaryPoint: raw.salaryPoint,
    salaryStructure: raw.salaryStructure, baseSalary: raw.baseSalary, positionSalary: raw.positionSalary,
    performanceBonus: raw.performanceBonus, startDate: raw.startDate ?? raw.startTime,
    endDate: raw.endDate ?? raw.endTime, remark: raw.remark
  });
}

export function sanitizePost(raw: PostRaw): PostSummary {
  return removeUndefined({
    postId: raw.postId, deptId: raw.deptId, postCode: raw.postCode, postName: raw.postName,
    postCategory: raw.postCategory, postLevel: raw.postLevel, deptName: raw.deptName,
    postSort: raw.postSort, status: raw.status, remark: raw.remark
  });
}

export function sanitizeEducationRecord(raw: EducationRecordRaw): Record<string, string> {
  return removeUndefined({
    startTime: raw.startTime, endTime: raw.endTime, educationLevel: raw.educationLevel,
    educationType: raw.educationType, school: raw.school, profession: raw.profession,
    certificate: raw.certificate, remark: raw.remark
  }) as Record<string, string>;
}

export function sanitizeChangeRecord(raw: ChangeRecordRaw): Record<string, string> {
  return removeUndefined({
    startTime: raw.startTime, endTime: raw.endTime, deptName: raw.deptName ?? raw.dept,
    postName: raw.postName, position: raw.position,
    positionLevel: raw.positionLevel ?? raw.level, remark: raw.remark
  }) as Record<string, string>;
}

export function sanitizeContractRecord(raw: ContractRecordRaw): Record<string, string> {
  return removeUndefined({
    startTime: raw.startTime, endTime: raw.endTime, contractType: raw.contractType,
    contractTerm: raw.contractTerm ?? raw.contractCnt, probationPeriod: raw.probationPeriod,
    probationTime: raw.probationTime, remark: raw.remark
  }) as Record<string, string>;
}

export function sanitizeSalaryRecord(raw: SalaryRecordRaw): Record<string, string> {
  return removeUndefined({
    startTime: raw.startTime, endTime: raw.endTime, salaryType: raw.salaryType,
    changeType: raw.changeType, salaryGrade: raw.salaryGrade, salaryPoint: raw.salaryPoint,
    salaryStructure: raw.salaryStructure, baseSalary: raw.baseSalary,
    positionSalary: raw.positionSalary, performanceBonus: raw.performanceBonus, remark: raw.remark
  }) as Record<string, string>;
}
