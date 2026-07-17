import { Controller, Post, Req } from '@nestjs/common';
import type { RequestWithContext } from '../common/request-context.js';
import { ModelService } from './model.service.js';

@Controller('model')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Post('test')
  async test(@Req() request: RequestWithContext): Promise<{ data: { connected: true } }> {
    return { data: await this.modelService.testConnection(request.requestContext.signal) };
  }
}
