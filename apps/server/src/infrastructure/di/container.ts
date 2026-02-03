import { ApproveQuestManuallyUseCase } from '../../application/use-cases/approve-quest-manually.use-case.js';
import { ComputeRepoReadinessUseCase } from '../../application/use-cases/compute-repo-readiness.use-case.js';
import { IngestScanRunUseCase } from '../../application/use-cases/ingest-scan-run.use-case.js';
import { FirebaseConfig } from '../config/firebase.config.js';
import { FirestoreClient } from '../persistence/firestore/firestore-client.js';
import { FirestoreQuestRepository } from '../persistence/firestore/repositories/firestore-quest-repository.js';
import { FirestoreRepoReadinessRepository } from '../persistence/firestore/repositories/firestore-repo-readiness-repository.js';
import { FirestoreScanRunRepository } from '../persistence/firestore/repositories/firestore-scan-run-repository.js';
import { FirestoreTeamRepository } from '../persistence/firestore/repositories/firestore-team-repository.js';

import type { QuestRepository } from '../../application/ports/quest-repository.js';
import type { RepoReadinessRepository } from '../../application/ports/repo-readiness-repository.js';
import type { ScanRunRepository } from '../../application/ports/scan-run-repository.js';
import type { TeamRepository } from '../../application/ports/team-repository.js';
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
    scanRunRepository: ScanRunRepository;
    questRepository: QuestRepository;
    repoReadinessRepository: RepoReadinessRepository;
    firebaseConfig: FirebaseConfig;
    firestoreClient: FirestoreClient;
    useCases: {
      ingestScanRun: () => IngestScanRunUseCase;
      computeRepoReadiness: () => ComputeRepoReadinessUseCase;
      approveQuestManually: () => ApproveQuestManuallyUseCase;
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
    firestoreClient = testFirestoreClient;
  } else {
    const firebaseConfig = new FirebaseConfig(config);
    firebaseConfig.initialize();
    fastify.decorate('firebaseConfig', firebaseConfig);

    const firestore = firebaseConfig.getFirestore();
    firestoreClient = new FirestoreClient(firestore);

    fastify.addHook('onClose', async () => {
      await firebaseConfig.close();
    });
  }

  fastify.decorate('firestoreClient', firestoreClient);

  const teamRepository = new FirestoreTeamRepository(firestoreClient);
  fastify.decorate('teamRepository', teamRepository);

  const scanRunRepository = new FirestoreScanRunRepository(firestoreClient);
  fastify.decorate('scanRunRepository', scanRunRepository);

  const questRepository = new FirestoreQuestRepository(firestoreClient);
  fastify.decorate('questRepository', questRepository);

  const repoReadinessRepository = new FirestoreRepoReadinessRepository(firestoreClient);
  fastify.decorate('repoReadinessRepository', repoReadinessRepository);

  const computeRepoReadinessUseCase = new ComputeRepoReadinessUseCase(
    questRepository,
    repoReadinessRepository,
  );

  const approveQuestManuallyUseCase = new ApproveQuestManuallyUseCase(
    questRepository,
    teamRepository,
    repoReadinessRepository,
  );

  fastify.decorate('useCases', {
    ingestScanRun: () =>
      new IngestScanRunUseCase(teamRepository, scanRunRepository, computeRepoReadinessUseCase),
    computeRepoReadiness: () => computeRepoReadinessUseCase,
    approveQuestManually: () => approveQuestManuallyUseCase,
  });
}
