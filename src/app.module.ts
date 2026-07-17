import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module.js';
import { ChatModule } from './chat/chat.module.js';
import { ConfigModule } from './config/config.module.js';
import { ErpModule } from './erp/erp.module.js';
import { HealthModule } from './health/health.module.js';
import { ModelModule } from './model/model.module.js';

@Module({ imports: [ConfigModule, HealthModule, ErpModule, ModelModule, AgentModule, ChatModule] })
export class AppModule {}
