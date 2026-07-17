import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';
import type { RequestWithContext } from '../request-context.js';
import { AppError } from './app-error.js';

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SafeExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    const appError = this.normalize(exception);
    const requestId = request.requestContext?.requestId ?? 'unknown';

    this.logger.error(JSON.stringify({
      requestId,
      route: request.originalUrl,
      method: request.method,
      status: appError.status,
      errorCode: appError.code
    }));

    if (!response.headersSent) {
      response.status(appError.status).json({
        error: { code: appError.code, message: appError.message, requestId }
      });
    }
  }

  private normalize(exception: unknown): AppError {
    if (exception instanceof AppError) return exception;
    if (exception instanceof ZodError) return new AppError('INVALID_REQUEST', { cause: exception });
    if (exception instanceof HttpException && exception.getStatus() === 413) {
      return new AppError('REQUEST_TOO_LARGE', { cause: exception });
    }
    return new AppError('INVALID_REQUEST', { cause: exception });
  }
}
