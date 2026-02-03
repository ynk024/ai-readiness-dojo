import { RepoReadiness } from '../../domain/repo-readiness/repo-readiness.js';
import { ScanRun } from '../../domain/scan-run/scan-run.js';
import { ProgrammingLanguage } from '../../domain/shared/programming-language.js';

import type { QuestRepository } from '../ports/quest-repository.js';
import type { RepoReadinessRepository } from '../ports/repo-readiness-repository.js';

/**
 * Use case for computing repository readiness from scan runs
 *
 * Orchestrates:
 * 1. Fetch language-specific quest catalog for enrichment
 * 2. Compute readiness from scan results
 * 3. Persist readiness snapshot
 */
export class ComputeRepoReadinessUseCase {
  constructor(
    private readonly questRepository: QuestRepository,
    private readonly repoReadinessRepository: RepoReadinessRepository,
  ) {}

  /**
   * Execute the readiness computation
   *
   * @param scanRun - The scan run to compute readiness from
   * @param language - The programming language of the repository (for quest filtering)
   * @returns The computed RepoReadiness entity
   */
  async execute(scanRun: ScanRun, language: ProgrammingLanguage | null): Promise<RepoReadiness> {
    // Step 1: Fetch language-specific quest catalog to enrich readiness with levels
    const quests = await this.questRepository.findActiveByLanguage(language);

    const questCatalog = new Map(
      quests.map((q) => [
        q.key,
        {
          key: q.key,
          levels: q.levels,
        },
      ]),
    );

    const scanRunSummary = {
      id: scanRun.id,
      repoId: scanRun.repoId,
      teamId: scanRun.teamId,
      scannedAt: scanRun.scannedAt,
      questResults: scanRun.questResults,
    };

    // Step 2: Compute readiness from scan run
    const readiness = RepoReadiness.computeFromScanRun(scanRunSummary, questCatalog);

    // Step 3: Persist readiness snapshot
    await this.repoReadinessRepository.save(readiness);

    return readiness;
  }
}
