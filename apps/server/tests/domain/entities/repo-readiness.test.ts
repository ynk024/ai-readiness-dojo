import { describe, it, expect } from 'vitest';

import { ReadinessStatus, RepoReadiness } from '../../../src/domain/repo-readiness/index.js';
import { QuestStatus, ScanRunId } from '../../../src/domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId } from '../../../src/domain/shared/index.js';
import { QuestDefinition, ScanRunSummary } from '../../../src/domain/shared/readiness-data.js';

describe('RepoReadiness Aggregate', () => {
  const scanRunId = ScanRunId.create('scan_123');
  const repoId = RepoId.create('repo_1');
  const teamId = TeamId.create('team_1');
  const scannedAt = new Date('2026-01-01T12:00:00Z');

  it('should compute readiness from scan run summary', () => {
    // Arrange: Create lightweight DTOs instead of full entities
    const questResults = new Map<string, QuestStatus>();
    questResults.set('quest_1', QuestStatus.pass());
    questResults.set('quest_2', QuestStatus.fail());

    const scanRunSummary: ScanRunSummary = {
      id: scanRunId,
      repoId,
      teamId,
      scannedAt,
      questResults,
    };

    const questCatalog = new Map<string, QuestDefinition>();
    questCatalog.set('quest_1', { key: 'quest_1' });
    questCatalog.set('quest_2', { key: 'quest_2' });

    // Act
    const readiness = RepoReadiness.computeFromScanRun(scanRunSummary, questCatalog);

    // Assert
    expect(readiness.repoId.equals(repoId)).toBe(true);
    expect(readiness.teamId.equals(teamId)).toBe(true);
    expect(readiness.computedFromScanRunId.equals(scanRunId)).toBe(true);

    // Check quest 1 (Complete)
    const q1 = readiness.getQuestStatus('quest_1');
    expect(q1).toBeDefined();
    expect(q1?.status.equals(ReadinessStatus.complete())).toBe(true);

    // Check quest 2 (Incomplete)
    const q2 = readiness.getQuestStatus('quest_2');
    expect(q2).toBeDefined();
    expect(q2?.status.equals(ReadinessStatus.incomplete())).toBe(true);

    // Check stats
    expect(readiness.getTotalQuests()).toBe(2);
    expect(readiness.getCompletionPercentage()).toBe(50);
  });

  it('should ignore quests not in catalog', () => {
    // Arrange
    const questResults = new Map<string, QuestStatus>();
    questResults.set('unknown_quest', QuestStatus.pass());

    const scanRunSummary: ScanRunSummary = {
      id: scanRunId,
      repoId,
      teamId,
      scannedAt,
      questResults,
    };

    const questCatalog = new Map<string, QuestDefinition>();

    // Act
    const readiness = RepoReadiness.computeFromScanRun(scanRunSummary, questCatalog);

    // Assert
    expect(readiness.getTotalQuests()).toBe(0);
  });
});
