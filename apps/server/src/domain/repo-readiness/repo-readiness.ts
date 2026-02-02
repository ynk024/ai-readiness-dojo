import { ScanRunId } from '../scan-run/scan-value-objects.js';
import { RepoId, TeamId } from '../shared/index.js';
import { QuestDefinition, ScanRunSummary } from '../shared/readiness-data.js';

import {
  ReadinessStatus,
  QuestReadinessEntry,
  createQuestReadinessEntry,
} from './repo-readiness-value-objects.js';

const PERCENTAGE_FACTOR = 100;

/**
 * Repository readiness snapshot
 * Represents the AI readiness state of a repository based on quest completion
 */
export interface RepoReadinessProps {
  repoId: RepoId;
  teamId: TeamId;
  computedFromScanRunId: ScanRunId;
  updatedAt: Date;
  quests: ReadonlyMap<string, QuestReadinessEntry>;
}

export class RepoReadiness {
  private constructor(private props: RepoReadinessProps) {}

  /**
   * Compute repo readiness from a scan run summary and quest catalog definitions
   *
   * @param scanRun - Summary of the scan run results
   * @param questCatalog - Map of quest keys to quest definitions
   * @returns New RepoReadiness instance
   */
  static computeFromScanRun(
    scanRun: ScanRunSummary,
    questCatalog: Map<string, QuestDefinition>,
  ): RepoReadiness {
    const questMap = new Map<string, QuestReadinessEntry>();

    // Process each quest result from the scan run
    for (const [questKey, questStatus] of scanRun.questResults) {
      const quest = questCatalog.get(questKey);

      // Skip quests not in catalog (shouldn't happen, but defensive)
      if (!quest) {
        continue;
      }

      // Map scan result status to readiness status
      let readinessStatus: ReadinessStatus;
      if (questStatus.isPass()) {
        readinessStatus = ReadinessStatus.complete();
      } else if (questStatus.isFail()) {
        readinessStatus = ReadinessStatus.incomplete();
      } else {
        readinessStatus = ReadinessStatus.unknown();
      }

      // Create readiness entry with quest level from catalog
      const entry = createQuestReadinessEntry(readinessStatus, 1, scanRun.scannedAt);

      questMap.set(questKey, entry);
    }

    return new RepoReadiness({
      repoId: scanRun.repoId,
      teamId: scanRun.teamId,
      computedFromScanRunId: scanRun.id,
      updatedAt: new Date(),
      quests: questMap,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: RepoReadinessProps): RepoReadiness {
    return new RepoReadiness(props);
  }

  get repoId(): RepoId {
    return this.props.repoId;
  }

  get teamId(): TeamId {
    return this.props.teamId;
  }

  get computedFromScanRunId(): ScanRunId {
    return this.props.computedFromScanRunId;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get quests(): ReadonlyMap<string, QuestReadinessEntry> {
    return this.props.quests;
  }

  /**
   * Get readiness status for a specific quest
   */
  getQuestStatus(questKey: string): QuestReadinessEntry | undefined {
    return this.props.quests.get(questKey);
  }

  /**
   * Get all completed quest keys
   */
  getCompletedQuests(): string[] {
    const completed: string[] = [];
    for (const [key, entry] of this.props.quests) {
      if (entry.status.isComplete()) {
        completed.push(key);
      }
    }
    return completed;
  }

  /**
   * Get all incomplete quest keys
   */
  getIncompleteQuests(): string[] {
    const incomplete: string[] = [];
    for (const [key, entry] of this.props.quests) {
      if (entry.status.isIncomplete()) {
        incomplete.push(key);
      }
    }
    return incomplete;
  }

  /**
   * Get total number of quests tracked
   */
  getTotalQuests(): number {
    return this.props.quests.size;
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const total = this.getTotalQuests();
    if (total === 0) {
      return 0;
    }

    const completed = this.getCompletedQuests().length;
    return Math.round((completed / total) * PERCENTAGE_FACTOR);
  }
}
