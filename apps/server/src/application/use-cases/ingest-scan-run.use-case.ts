import { ScanRun } from '../../domain/entities/scan-run.js';
import { ScanRunId, CommitSha } from '../../domain/value-objects/scan-value-objects.js';
import {
  AiReadinessReportMapper,
  type AiReadinessReport,
} from '../mappers/ai-readiness-report-mapper.js';
import { TeamRepoResolver } from '../services/team-repo-resolver.js';

import type { RepoRepository } from '../../domain/repositories/repo-repository.js';
import type { ScanRunRepository } from '../../domain/repositories/scan-run-repository.js';
import type { TeamRepository } from '../../domain/repositories/team-repository.js';

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
 * 1. Extract metadata and quest results from AI-Readiness report
 * 2. Resolve or create team and repo
 * 3. Create ScanRun entity with quest results
 * 4. Persist ScanRun to repository
 * 5. Return summary with IDs and quest counts
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
   * @param report - AI-Readiness report from GitHub Action
   * @returns Ingestion result with IDs and summary
   */
  async execute(report: AiReadinessReport): Promise<IngestScanRunResult> {
    // Step 1: Extract metadata and quest results from report
    const metadata = AiReadinessReportMapper.extractRepoMetadata(report);
    const questResults = AiReadinessReportMapper.extractQuestResults(report);

    // Step 2: Resolve or create team and repo
    const { team, repo } = await this.teamRepoResolver.resolveFromMetadata(metadata);

    // Step 3: Generate unique scan run ID
    const scanRunId = this.generateScanRunId(metadata.providerRunId);

    // Step 4: Create ScanRun entity
    const scanRun = ScanRun.create({
      id: scanRunId,
      teamId: team.id,
      repoId: repo.id,
      commitSha: CommitSha.create(metadata.commitSha),
      refName: metadata.refName,
      providerRunId: metadata.providerRunId,
      runUrl: metadata.runUrl,
      workflowVersion: metadata.workflowVersion,
      scannedAt: metadata.scannedAt,
      questResults,
    });

    // Step 5: Persist scan run
    await this.scanRunRepository.save(scanRun);

    // Step 6: Return result with summary
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
