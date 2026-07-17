import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { chatRequestSchema, type SseEvent } from '@erp-assistant/contracts';
import type { RequestWithContext } from '../common/request-context.js';
import { AppError, toAppError } from '../common/errors/app-error.js';
import { ChatService } from './chat.service.js';
import { encodeSse } from './chat-stream.adapter.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Body() body: unknown,
    @Req() request: RequestWithContext,
    @Res() response: Response
  ): Promise<void> {
    const contentLength = Number(request.headers['content-length'] ?? 0);
    if (Number.isFinite(contentLength) && contentLength > 128 * 1024) {
      throw new AppError('REQUEST_TOO_LARGE');
    }
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) throw new AppError('INVALID_MESSAGES', { cause: parsed.error });

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const cancel = () => { if (!response.writableEnded) controller.abort(); };
    request.once('aborted', cancel);
    response.once('close', cancel);
    const context = { ...request.requestContext, signal: controller.signal };
    const write = (event: SseEvent) => { if (!response.writableEnded) response.write(encodeSse(event)); };

    write({ event: 'meta', data: { requestId: context.requestId } });
    try {
      for await (const event of this.chatService.stream(parsed.data.messages, context)) {
        if (event.type === 'text') write({ event: 'text-delta', data: { delta: event.delta } });
        if (event.type === 'tool') write({ event: 'tool-status', data: { tool: event.tool, status: event.status } });
        if (event.type === 'done') write({ event: 'done', data: { finishReason: event.finishReason } });
      }
    } catch (error) {
      if (!controller.signal.aborted || !request.aborted) {
        const appError = toAppError(error, 'MODEL_UPSTREAM_ERROR');
        write({ event: 'error', data: { code: appError.code, message: appError.message } });
      }
    } finally {
      clearTimeout(timeout);
      request.off('aborted', cancel);
      response.off('close', cancel);
      if (!response.writableEnded) response.end();
    }
  }
}
