import { Controller, Get, Inject, Req } from '@nestjs/common';
import type { CurrentUserSummary } from '@erp-assistant/contracts';
import type { RequestWithContext } from '../common/request-context.js';
import { ERP_READ_GATEWAY, type ErpReadGateway } from './domain/erp-read.gateway.js';

@Controller('erp')
export class ErpController {
  constructor(@Inject(ERP_READ_GATEWAY) private readonly gateway: ErpReadGateway) {}

  @Get('me')
  async getMe(@Req() request: RequestWithContext): Promise<{ data: CurrentUserSummary }> {
    return { data: await this.gateway.getCurrentUser(request.requestContext) };
  }
}
