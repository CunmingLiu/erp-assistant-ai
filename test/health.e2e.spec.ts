import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('health API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => app.close());

  it('starts without ERP or model credentials', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'erp-agent-api' });
    expect(new Date(response.body.timestamp as string).toString()).not.toBe('Invalid Date');
  });
});
