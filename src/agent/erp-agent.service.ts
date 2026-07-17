import { Injectable } from '@nestjs/common';
import type { ChatMessage, PublicToolName } from '@erp-assistant/contracts';
import { isStepCount, streamText, type ModelMessage } from 'ai';
import type { RequestContext } from '../common/request-context.js';
import { AppError } from '../common/errors/app-error.js';
import { ModelFactory } from '../model/model.factory.js';
import { ERP_AGENT_INSTRUCTIONS } from './agent.instructions.js';
import { ToolRegistryService } from './tool-registry.service.js';

export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool'; tool: PublicToolName; status: 'started' | 'completed' }
  | { type: 'done'; finishReason: string };

const publicTools = new Set<PublicToolName>([
  'getCurrentUser', 'queryEmployees', 'queryContracts', 'querySalary', 'queryPosts'
]);

function isPublicTool(value: string): value is PublicToolName {
  return publicTools.has(value as PublicToolName);
}

@Injectable()
export class ErpAgentService {
  constructor(
    private readonly modelFactory: ModelFactory,
    private readonly toolRegistry: ToolRegistryService
  ) {}

  async *stream(messages: ChatMessage[], context: RequestContext): AsyncGenerator<AgentEvent> {
    const { model, timeoutMs } = this.modelFactory.create();
    const modelMessages: ModelMessage[] = messages.map(({ role, content }) => ({ role, content }));
    const started = new Set<string>();
    try {
      const result = streamText({
        model,
        system: ERP_AGENT_INSTRUCTIONS,
        messages: modelMessages,
        tools: this.toolRegistry.createTools(context),
        stopWhen: isStepCount(3),
        maxRetries: 0,
        timeout: timeoutMs,
        ...(context.signal ? { abortSignal: context.signal } : {})
      });

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') yield { type: 'text', delta: part.text };
        if (part.type === 'tool-input-start' && isPublicTool(part.toolName) && !started.has(part.id)) {
          started.add(part.id);
          yield { type: 'tool', tool: part.toolName, status: 'started' };
        }
        if (part.type === 'tool-result' && isPublicTool(part.toolName)) {
          yield { type: 'tool', tool: part.toolName, status: 'completed' };
        }
        if (part.type === 'error') throw new AppError('MODEL_UPSTREAM_ERROR', { cause: part.error });
        if (part.type === 'abort') throw new AppError('MODEL_TIMEOUT');
        if (part.type === 'finish') yield { type: 'done', finishReason: part.finishReason };
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (context.signal?.aborted) throw new AppError('MODEL_TIMEOUT', { cause: error });
      throw new AppError('MODEL_UPSTREAM_ERROR', { cause: error });
    }
  }
}
