import type { ErrorCode } from '@erp-assistant/contracts';

const statusByCode: Record<ErrorCode, number> = {
  INVALID_REQUEST: 400,
  INVALID_MESSAGES: 400,
  ERP_UNAUTHORIZED: 401,
  TOOL_DISABLED: 403,
  REQUEST_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  ERP_CONFIG_ERROR: 500,
  MODEL_CONFIG_ERROR: 500,
  ERP_INVALID_RESPONSE: 502,
  ERP_UPSTREAM_ERROR: 502,
  MODEL_UPSTREAM_ERROR: 502,
  ERP_TIMEOUT: 504,
  MODEL_TIMEOUT: 504
};

const safeMessages: Record<ErrorCode, string> = {
  INVALID_REQUEST: '请求格式无效',
  INVALID_MESSAGES: '消息数量、角色或内容无效',
  ERP_UNAUTHORIZED: 'ERP 登录已失效，请更新服务端配置',
  TOOL_DISABLED: '该查询能力未在当前部署启用',
  REQUEST_TOO_LARGE: '请求内容过大',
  RATE_LIMITED: '请求过于频繁，请稍后重试',
  ERP_CONFIG_ERROR: 'ERP 服务尚未正确配置',
  MODEL_CONFIG_ERROR: '模型服务尚未正确配置',
  ERP_INVALID_RESPONSE: 'ERP 返回了无法识别的数据',
  ERP_UPSTREAM_ERROR: 'ERP 服务暂时不可用',
  MODEL_UPSTREAM_ERROR: '模型服务暂时不可用',
  ERP_TIMEOUT: 'ERP 查询超时，请稍后重试',
  MODEL_TIMEOUT: '模型响应超时，请稍后重试'
};

export class AppError extends Error {
  readonly status: number;

  constructor(readonly code: ErrorCode, options?: ErrorOptions) {
    super(safeMessages[code], options);
    this.name = 'AppError';
    this.status = statusByCode[code];
  }
}

export function toAppError(error: unknown, fallback: ErrorCode): AppError {
  return error instanceof AppError ? error : new AppError(fallback, { cause: error });
}
