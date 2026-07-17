import { z } from 'zod';

export const idSchema = z.union([z.string(), z.number()]);
const text = z.union([z.string(), z.number()]).transform(String);
const optionalText = text.nullish().transform((value) => value ?? undefined);
const optionalId = idSchema.nullish().transform((value) => value ?? undefined);

export const employeeRawSchema = z.object({
  id: optionalId, staffNo: optionalText, staffName: optionalText,
  deptId: optionalId, deptName: optionalText, postId: optionalId, postName: optionalText,
  position: optionalText, positionLevel: optionalText, parentName: optionalText, workplaceCity: optionalText,
  appointmentDate: optionalText, hireDate: optionalText, workYears: optionalText, employmentStatus: optionalText,
  educationLevel: optionalText, educationType: optionalText, school: optionalText, profession: optionalText,
  certificate: optionalText, resignationDate: optionalText, resignationReason: optionalText,
  dimissionTime: optionalText, dimissionCause: optionalText
}).passthrough();

export const contractRawSchema = employeeRawSchema.extend({
  contractType: optionalText, contractCount: optionalText, contractCnt: optionalText, contractTerm: optionalText,
  contractStartDate: optionalText, contractEndDate: optionalText, startTime: optionalText, endTime: optionalText,
  contractRemainingDays: optionalText, probationPeriod: optionalText, probationDate: optionalText,
  probationTime: optionalText, remark: optionalText, contractRemark: optionalText
});

export const salaryRawSchema = employeeRawSchema.extend({
  salaryType: optionalText, changeType: optionalText, salaryGrade: optionalText, salaryPoint: optionalText,
  salaryStructure: optionalText, baseSalary: optionalText, positionSalary: optionalText,
  performanceBonus: optionalText, startDate: optionalText, endDate: optionalText,
  startTime: optionalText, endTime: optionalText, remark: optionalText
});

export const educationRecordRawSchema = z.object({
  startTime: optionalText, endTime: optionalText, educationLevel: optionalText,
  educationType: optionalText, school: optionalText, profession: optionalText,
  certificate: optionalText, remark: optionalText
}).passthrough();

export const changeRecordRawSchema = z.object({
  startTime: optionalText, endTime: optionalText, deptName: optionalText,
  dept: optionalText, postName: optionalText, position: optionalText,
  positionLevel: optionalText, level: optionalText, remark: optionalText
}).passthrough();

export const contractRecordRawSchema = z.object({
  startTime: optionalText, endTime: optionalText, contractType: optionalText,
  contractTerm: optionalText, contractCnt: optionalText, probationPeriod: optionalText,
  probationTime: optionalText, remark: optionalText
}).passthrough();

export const salaryRecordRawSchema = z.object({
  startTime: optionalText, endTime: optionalText, salaryType: optionalText,
  changeType: optionalText, salaryGrade: optionalText, salaryPoint: optionalText,
  salaryStructure: optionalText, baseSalary: optionalText, positionSalary: optionalText,
  performanceBonus: optionalText, remark: optionalText
}).passthrough();

export const postRawSchema = z.object({
  postId: optionalId, deptId: optionalId, postCode: optionalText, postName: optionalText,
  postCategory: optionalText, postLevel: z.union([z.array(text), text.transform((value) => [value])]).nullish().transform((value) => value ?? undefined),
  deptName: optionalText,
  postSort: z.preprocess((value) => value === null || value === undefined ? undefined : value, z.coerce.number().optional()),
  status: optionalText, remark: optionalText
}).passthrough();

export const listEnvelopeSchema = <T extends z.ZodType>(row: T) => z.object({
  code: z.union([z.string(), z.number()]).optional(),
  rows: z.array(row),
  total: z.coerce.number().int().nonnegative().default(0)
}).passthrough();

export const dataEnvelopeSchema = <T extends z.ZodType>(data: T) => z.object({
  code: z.union([z.string(), z.number()]).optional(),
  data
}).passthrough();

export const currentUserEnvelopeSchema = dataEnvelopeSchema(z.object({
  user: z.object({
    userId: idSchema, tenantId: text, userName: text, nickName: text,
    deptName: text.optional(), admin: z.boolean().default(false), status: text
  }).passthrough(),
  roles: z.array(text).default([]),
  permissions: z.array(z.unknown()).default([])
}).passthrough());

export const countEnvelopeSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
  data: z.union([
    z.object({ todoCount: z.coerce.number().int().nonnegative() }).passthrough(),
    z.coerce.number().int().nonnegative().transform((todoCount) => ({ todoCount }))
  ])
}).passthrough();
