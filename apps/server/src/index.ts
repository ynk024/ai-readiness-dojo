import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

import { healthRoutes } from './routes/health.js';

const DEFAULT_PORT = 3000;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
const HOST = process.env.HOST ?? '0.0.0.0';

export async function buildServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true,
  });

  // Register routes
  await fastify.register(healthRoutes);

  return fastify;
}

async function start(): Promise<void> {
  try {
    const fastify: FastifyInstance = await buildServer();
    await fastify.listen({ port: PORT, host: HOST });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (import.meta.url === `file://${process.argv[1] ?? ''}`) {
  void start();
}
