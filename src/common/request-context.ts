import type { Request } from 'express';

export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
  signal?: AbortSignal;
}

export interface RequestWithContext extends Request {
  requestContext: RequestContext;
}
