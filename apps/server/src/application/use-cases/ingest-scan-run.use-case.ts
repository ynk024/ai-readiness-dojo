import { ScanRun } from '../../domain/scan-run/scan-run.js';
import { ScanRunId, CommitSha } from '../../domain/scan-run/scan-value-objects.js';
import { TeamRepoResolver } from '../services/team-repo-resolver.js';

import type { IngestScanRunDto } from '../dto/ingest-scan-run.dto.js';
import type { RepoRepository } from '../ports/repo-repository.js';
import type { ScanRunRepository } from '../ports/scan-run-repository.js';
import type { TeamRepository } from '../ports/team-repository.js';

/**
 * Result of ingesting a scan run
 */
export interface IngestScanRunResult {
  scanRunId: string;
  teamId: string;
  repoId: string;
  summary: {
    totalQuests: number;
    passedQuests: number;
    failedQuests: number;
  };
}

/**
 * Use case for ingesting AI-Readiness scan runs.
 *
 * Orchestrates the full ingestion flow:
 * 1. Resolve or create team and repo
 * 2. Create ScanRun entity with quest results
 * 3. Persist ScanRun to repository
 * 4. Return summary with IDs and quest counts
 */
export class IngestScanRunUseCase {
  private readonly teamRepoResolver: TeamRepoResolver;

  constructor(
    teamRepository: TeamRepository,
    repoRepository: RepoRepository,
    private readonly scanRunRepository: ScanRunRepository,
  ) {
    this.teamRepoResolver = new TeamRepoResolver(teamRepository, repoRepository);
  }

  /**
   * Execute the scan run ingestion use case
   *
   * @param dto - Scan run data transfer object
   * @returns Ingestion result with IDs and summary
   */
  async execute(dto: IngestScanRunDto): Promise<IngestScanRunResult> {
    // Step 1: Resolve or create team and repo
    const { team, repo } = await this.teamRepoResolver.resolveFromMetadata(dto.metadata);

    // Step 2: Generate unique scan run ID
    const scanRunId = this.generateScanRunId(dto.metadata.providerRunId);

    // Step 3: Create ScanRun entity
    const scanRun = ScanRun.create({
      id: scanRunId,
      teamId: team.id,
      repoId: repo.id,
      commitSha: CommitSha.create(dto.metadata.commitSha),
      refName: dto.metadata.refName,
      providerRunId: dto.metadata.providerRunId,
      runUrl: dto.metadata.runUrl,
      workflowVersion: dto.metadata.workflowVersion,
      scannedAt: dto.metadata.scannedAt,
      questResults: dto.questResults,
    });

    // Step 4: Persist scan run
    await this.scanRunRepository.save(scanRun);

    // Step 5: Return result with summary
    return {
      scanRunId: scanRun.id.value,
      teamId: team.id.value,
      repoId: repo.id.value,
      summary: {
        totalQuests: scanRun.getTotalQuests(),
        passedQuests: scanRun.getPassedQuests().length,
        failedQuests: scanRun.getFailedQuests().length,
      },
    };
  }

  /**
   * Generate a unique scan run ID
   * Convention: scanrun_{providerRunId}_{timestamp}
   *
   * @param providerRunId - Provider's run ID (e.g., GitHub Actions run ID)
   * @returns Unique ScanRunId
   */
  private generateScanRunId(providerRunId: string): ScanRunId {
    const timestamp = Date.now();
    return ScanRunId.create(`scanrun_${providerRunId}_${timestamp}`);
  }
}
