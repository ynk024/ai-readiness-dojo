import { RepoReadiness } from '../../domain/repo-readiness/repo-readiness.js';
import { ScanRun } from '../../domain/scan-run/scan-run.js';
import { ProgrammingLanguage } from '../../domain/shared/programming-language.js';

import type { QuestRepository } from '../ports/quest-repository.js';
import type { RepoReadinessRepository } from '../ports/repo-readiness-repository.js';

/**
 * Use case for computing repository readiness from scan runs
 *
 * Orchestrates:
 * 1. Fetch existing readiness snapshot to preserve manual approvals
 * 2. Fetch language-specific quest catalog (filtered to auto-detectable quests)
 * 3. Compute readiness from scan results (merging with existing manual approvals)
 * 4. Persist readiness snapshot
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
    // Step 1: Fetch existing readiness snapshot to preserve manual approvals
    const existingReadiness = await this.repoReadinessRepository.findByRepoId(scanRun.repoId);

    // Step 2: Fetch language-specific quest catalog and filter to auto-detectable quests only
    const allQuests = await this.questRepository.findActiveByLanguage(language);
    const autoDetectableQuests = allQuests.filter((q) => q.canBeAutoDetected());

    const questCatalog = new Map(
      autoDetectableQuests.map((q) => [
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

    // Step 3: Compute readiness from scan run, merging with existing manual approvals
    const readiness = RepoReadiness.computeFromScanRun(
      scanRunSummary,
      questCatalog,
      existingReadiness ?? undefined,
    );

    // Step 4: Persist readiness snapshot
    await this.repoReadinessRepository.save(readiness);

    return readiness;
  }
}
