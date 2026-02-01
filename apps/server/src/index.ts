import 'dotenv/config';

import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';

import { loadEnvironmentConfig } from './infrastructure/config/environment.js';
import { registerDependencies } from './infrastructure/di/container.js';
import { FirestoreClient } from './infrastructure/persistence/firestore/firestore-client.js';
import { healthRoutes } from './presentation/routes/health.js';
import { ingestRoutes } from './presentation/routes/ingest.routes.js';
import { itemsRoutes } from './presentation/routes/items.routes.js';
import { questsRoutes } from './presentation/routes/quests.routes.js';

export async function buildServer(testFirestoreClient?: FirestoreClient): Promise<FastifyInstance> {
  // Load and validate environment configuration
  const config = loadEnvironmentConfig();

  const fastify = Fastify({
    logger: {
      transport:
        config.nodeEnv !== 'production'
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

  // Register dependencies (DI container - composition root)
  registerDependencies(fastify, config, testFirestoreClient);

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(itemsRoutes);
  await fastify.register(questsRoutes, { prefix: '/api' });
  await fastify.register(ingestRoutes, { prefix: '/api' });

  return fastify;
}

async function start(): Promise<void> {
  try {
    const config = loadEnvironmentConfig();
    const fastify: FastifyInstance = await buildServer();
    await fastify.listen({ port: config.port, host: config.host });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (import.meta.url === `file://${process.argv[1] ?? ''}`) {
  void start();
}
