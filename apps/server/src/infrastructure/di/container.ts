import { IngestScanRunUseCase } from '../../application/use-cases/ingest-scan-run.use-case.js';
import { FirebaseConfig } from '../config/firebase.config.js';
import { FirestoreClient } from '../persistence/firestore/firestore-client.js';
import { FirestoreQuestRepository } from '../persistence/firestore/repositories/firestore-quest-repository.js';
import { FirestoreRepoRepository } from '../persistence/firestore/repositories/firestore-repo-repository.js';
import { FirestoreScanRunRepository } from '../persistence/firestore/repositories/firestore-scan-run-repository.js';
import { FirestoreTeamRepository } from '../persistence/firestore/repositories/firestore-team-repository.js';

import type { QuestRepository } from '../../domain/quest/quest-repository.js';
import type { RepoRepository } from '../../domain/repo/repo-repository.js';
import type { ScanRunRepository } from '../../domain/scan-run/scan-run-repository.js';
import type { TeamRepository } from '../../domain/team/team-repository.js';
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
    teamRepository: TeamRepository;
    repoRepository: RepoRepository;
    scanRunRepository: ScanRunRepository;
    questRepository: QuestRepository;
    firebaseConfig: FirebaseConfig;
    firestoreClient: FirestoreClient;
    useCases: {
      ingestScanRun: () => IngestScanRunUseCase;
    };
  }
}

/**
 * Registers all dependencies with the Fastify instance
 *
 * @param fastify - Fastify instance
 * @param config - Environment configuration
 * @param testFirestoreClient - Optional Firestore client for testing (overrides default)
 */
export function registerDependencies(
  fastify: FastifyInstance,
  config: EnvironmentConfig,
  testFirestoreClient?: FirestoreClient,
): void {
  let firestoreClient: FirestoreClient;

  if (testFirestoreClient) {
    // Use provided test client (for integration tests)
    firestoreClient = testFirestoreClient;
    // Note: We don't initialize Firebase or add cleanup hooks when using test client
  } else {
    // Initialize Firebase (production/normal flow)
    const firebaseConfig = new FirebaseConfig(config);
    firebaseConfig.initialize();
    fastify.decorate('firebaseConfig', firebaseConfig);

    // Create Firestore client
    const firestore = firebaseConfig.getFirestore();
    firestoreClient = new FirestoreClient(firestore);

    // Register cleanup hook
    fastify.addHook('onClose', async () => {
      await firebaseConfig.close();
    });
  }

  // Decorate Firestore client
  fastify.decorate('firestoreClient', firestoreClient);

  // Register repositories (driven adapters)
  const teamRepository = new FirestoreTeamRepository(firestoreClient);
  fastify.decorate('teamRepository', teamRepository);

  const repoRepository = new FirestoreRepoRepository(firestoreClient);
  fastify.decorate('repoRepository', repoRepository);

  const scanRunRepository = new FirestoreScanRunRepository(firestoreClient);
  fastify.decorate('scanRunRepository', scanRunRepository);

  const questRepository = new FirestoreQuestRepository(firestoreClient);
  fastify.decorate('questRepository', questRepository);

  // Register use cases with factory pattern
  fastify.decorate('useCases', {
    ingestScanRun: () =>
      new IngestScanRunUseCase(teamRepository, repoRepository, scanRunRepository),
  });
}
