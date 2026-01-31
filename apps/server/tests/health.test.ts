import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildServer } from '../src/index.js';

import type { FastifyInstance } from 'fastify';

interface HealthResponseBody {
  status: string;
  timestamp: string;
  uptime: number;
}

describe('Health Endpoint', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return 200 status code', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return health status as ok', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    const body = JSON.parse(response.body) as HealthResponseBody;
    expect(body.status).toBe('ok');
  });

  it('should return timestamp in ISO format', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    const body = JSON.parse(response.body) as HealthResponseBody;
    expect(body.timestamp).toBeDefined();

    // Check if it's a valid ISO string
    const date = new Date(body.timestamp);
    expect(date.toISOString()).toBe(body.timestamp);
  });

  it('should return uptime as a number', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    const body = JSON.parse(response.body) as HealthResponseBody;
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should return valid JSON response', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    const contentType = response.headers['content-type'];
    expect(contentType).toBeDefined();
    expect(typeof contentType === 'string' ? contentType : '').toContain('application/json');

    const parsedBody = JSON.parse(response.body) as HealthResponseBody;
    expect(parsedBody).toBeDefined();
  });
});
