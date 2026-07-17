import 'reflect-metadata';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config as loadDotEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { json, type NextFunction, type Request, type Response } from 'express';
import { AppModule } from './app.module.js';
import { SafeExceptionFilter } from './common/errors/safe-exception.filter.js';
import type { RequestWithContext } from './common/request-context.js';
import { AppConfigService } from './config/app-config.service.js';

loadDotEnv({ path: resolve(process.cwd(), '.env'), quiet: true });
loadDotEnv({ path: resolve(process.cwd(), '..', '.env'), quiet: true });

const safeRequestId = /^[A-Za-z0-9._-]{1,100}$/;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(AppConfigService);
  const express = app.getHttpAdapter().getInstance() as { disable(name: string): void };
  express.disable('x-powered-by');

  app.use((request: Request, response: Response, next: NextFunction) => {
    const supplied = request.header('x-request-id');
    const requestId = supplied && safeRequestId.test(supplied) ? supplied : randomUUID();
    (request as RequestWithContext).requestContext = { requestId };
    response.setHeader('X-Request-Id', requestId);
    const length = Number(request.header('content-length') ?? 0);
    if (Number.isFinite(length) && length > 128 * 1024) {
      response.status(413).json({ error: { code: 'REQUEST_TOO_LARGE', message: '请求内容过大', requestId } });
      return;
    }
    next();
  });
  app.use(json({ limit: '128kb', strict: true }));
  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.app.WEB_ORIGIN, methods: ['GET', 'POST'], credentials: false });
  app.useGlobalFilters(new SafeExceptionFilter());
  await app.listen(config.app.API_PORT, '127.0.0.1');
}

void bootstrap();
