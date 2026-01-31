import type { FastifyInstance } from 'fastify';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

export function healthRoutes(fastify: FastifyInstance): void {
  fastify.get<{ Reply: HealthResponse }>('/health', (): HealthResponse => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
}
