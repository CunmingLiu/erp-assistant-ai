import { Injectable } from '@nestjs/common';
import type { ChatMessage } from '@erp-assistant/contracts';
import type { RequestContext } from '../common/request-context.js';
import { ErpAgentService, type AgentEvent } from '../agent/erp-agent.service.js';

@Injectable()
export class ChatService {
  constructor(private readonly agent: ErpAgentService) {}

  stream(messages: ChatMessage[], context: RequestContext): AsyncGenerator<AgentEvent> {
    return this.agent.stream(messages, context);
  }
}
