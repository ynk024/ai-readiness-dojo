import { FirebaseConfig } from '../config/firebase.config.js';
import { FirestoreClient } from '../persistence/firestore/firestore-client.js';
import { FirestoreItemRepository } from '../persistence/firestore/repositories/firestore-item-repository.js';

import type { ItemRepository } from '../../domain/repositories/item-repository.js';
import type { EnvironmentConfig } from '../config/environment.js';
import type { FastifyInstance } from 'fastify';

/**
 * Dependency Injection Container
 *
 * Registers repositories and services with Fastify's decorator pattern.
 * This acts as the composition root where all dependencies are wired together.
 */

// Extend Fastify types to include our decorators
declare module 'fastify' {
  interface FastifyInstance {
    itemRepository: ItemRepository;
    firebaseConfig: FirebaseConfig;
    firestoreClient: FirestoreClient;
  }
}

/**
 * Registers all dependencies with the Fastify instance
 */
export function registerDependencies(fastify: FastifyInstance, config: EnvironmentConfig): void {
  // Initialize Firebase
  const firebaseConfig = new FirebaseConfig(config);
  firebaseConfig.initialize();
  fastify.decorate('firebaseConfig', firebaseConfig);

  // Create Firestore client
  const firestore = firebaseConfig.getFirestore();
  const firestoreClient = new FirestoreClient(firestore);
  fastify.decorate('firestoreClient', firestoreClient);

  // Register repositories (driven adapters)
  const itemRepository = new FirestoreItemRepository(firestoreClient);
  fastify.decorate('itemRepository', itemRepository);

  // Register cleanup hook
  fastify.addHook('onClose', async () => {
    await firebaseConfig.close();
  });
}
