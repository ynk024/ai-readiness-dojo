import { ScanResult, ScanRunId } from '../scan-run/scan-value-objects.js';
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

    for (const [questKey, scanResult] of scanRun.questResults) {
      const quest = questCatalog.get(questKey);
      if (!quest) {
        continue;
      }

      const entry = this.computeReadinessEntry(quest, scanResult, scanRun.scannedAt);
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

  private static computeReadinessEntry(
    quest: QuestDefinition,
    scanResult: ScanResult,
    scannedAt: Date,
  ): QuestReadinessEntry {
    const maxAchievedLevel = RepoReadiness.calculateMaxLevel(quest, scanResult);

    const isComplete = maxAchievedLevel > 0;
    const readinessStatus = isComplete ? ReadinessStatus.complete() : ReadinessStatus.incomplete();
    const entryLevel = isComplete ? maxAchievedLevel : 1;

    return createQuestReadinessEntry(readinessStatus, entryLevel, scannedAt);
  }

  private static calculateMaxLevel(quest: QuestDefinition, scanResult: ScanResult): number {
    if (quest.levels.length > 0) {
      let maxLevel = 0;
      for (const level of quest.levels) {
        if (RepoReadiness.checkCondition(level.condition, scanResult)) {
          maxLevel = Math.max(maxLevel, level.level);
        }
      }
      return maxLevel;
    }

    // Fallback
    if (RepoReadiness.matchesFallbackCriteria(scanResult)) {
      return 1;
    }
    return 0;
  }

  private static matchesFallbackCriteria(scanResult: ScanResult): boolean {
    const data = scanResult.data;
    return (
      data.passed === true ||
      data.present === true ||
      (typeof data.count === 'number' && data.count > 0)
    );
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

  private static checkCondition(
    condition:
      | { type: 'pass' }
      | { type: 'count'; min: number }
      | { type: 'score'; min: number }
      | { type: 'exists' },
    result: ScanResult,
  ): boolean {
    const data = result.data;
    switch (condition.type) {
      case 'pass':
        // 'pass' type in condition assumes explicit pass success
        return data.passed === true || data.present === true || data.available === true;
      case 'exists':
        return data.present === true;
      case 'count':
        if (typeof data.count === 'number') {
          return data.count >= condition.min;
        }
        return false;
      case 'score':
        if (typeof data.score === 'number') {
          return data.score >= condition.min;
        }
        return false;
      default:
        return false;
    }
  }
}
