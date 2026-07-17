import { Module } from '@nestjs/common';
import { ErpModule } from '../erp/erp.module.js';
import { ModelModule } from '../model/model.module.js';
import { ErpAgentService } from './erp-agent.service.js';
import { ToolRegistryService } from './tool-registry.service.js';

@Module({
  imports: [ErpModule, ModelModule],
  providers: [ErpAgentService, ToolRegistryService],
  exports: [ErpAgentService]
})
export class AgentModule {}
