import { FastifyInstance, FastifyPluginAsync } from 'fastify';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get<{ Reply: HealthResponse }>('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
};
