import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@erp-assistant/contracts';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return { status: 'ok', service: 'erp-agent-api', timestamp: new Date().toISOString() };
  }
}
