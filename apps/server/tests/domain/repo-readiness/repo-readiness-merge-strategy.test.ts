import { describe, it, expect } from 'vitest';

import { ReadinessStatus } from '../../../src/domain/repo-readiness/repo-readiness-value-objects.js';
import { RepoReadiness } from '../../../src/domain/repo-readiness/repo-readiness.js';
import { ScanRunId, ScanResult } from '../../../src/domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId, UserId } from '../../../src/domain/shared/index.js';
import { QuestDefinition, ScanRunSummary } from '../../../src/domain/shared/readiness-data.js';

describe('RepoReadiness - Merge Strategy', () => {
  const scanRunSummary: ScanRunSummary = {
    id: ScanRunId.create('scan-123'),
    repoId: RepoId.create('repo-123'),
    teamId: TeamId.create('team-123'),
    scannedAt: new Date(),
    questResults: new Map(),
  };

  const questCatalog = new Map<string, QuestDefinition>();

  describe('computeFromScanRun with existing readiness', () => {
    it('should preserve manual approvals when computing from new scan', () => {
      questCatalog.set('quest-auto', {
        key: 'quest-auto',
        levels: [{ level: 1, condition: { type: 'pass' } }],
      });

      // Create existing readiness with manual approval
      const existingReadiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo-123'),
        teamId: TeamId.create('team-123'),
        computedFromScanRunId: ScanRunId.create('scan-old'),
        updatedAt: new Date('2024-01-01'),
        quests: new Map(),
      });
      existingReadiness.approveQuestManually('quest-manual', UserId.create('user_123'), 2);

      // New scan with automatic quest
      const results = new Map<string, ScanResult>();
      results.set('quest-auto', ScanResult.create({ passed: true }));
      const summary = { ...scanRunSummary, questResults: results };

      // Compute with merge
      const newReadiness = RepoReadiness.computeFromScanRun(
        summary,
        questCatalog,
        existingReadiness,
      );

      // Manual approval should be preserved
      const manualEntry = newReadiness.getQuestStatus('quest-manual');
      expect(manualEntry).toBeDefined();
      expect(manualEntry?.completionSource).toBe('manual');
      expect(manualEntry?.level).toBe(2);

      // Auto quest should also exist
      const autoEntry = newReadiness.getQuestStatus('quest-auto');
      expect(autoEntry).toBeDefined();
      expect(autoEntry?.completionSource).toBe('automatic');
    });

    it('should NOT override manual approval with scan results', () => {
      questCatalog.set('quest-both', {
        key: 'quest-both',
        levels: [{ level: 1, condition: { type: 'pass' } }],
      });

      // Existing readiness with manual approval at level 3
      const existingReadiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo-123'),
        teamId: TeamId.create('team-123'),
        computedFromScanRunId: ScanRunId.create('scan-old'),
        updatedAt: new Date('2024-01-01'),
        quests: new Map(),
      });
      existingReadiness.approveQuestManually('quest-both', UserId.create('user_123'), 3);

      // New scan detects the quest-both at level 1
      const results = new Map<string, ScanResult>();
      results.set('quest-both', ScanResult.create({ passed: true }));
      const summary = { ...scanRunSummary, questResults: results };

      // Compute with merge
      const newReadiness = RepoReadiness.computeFromScanRun(
        summary,
        questCatalog,
        existingReadiness,
      );

      // Manual approval should win (level 3, not 1)
      const entry = newReadiness.getQuestStatus('quest-both');
      expect(entry?.completionSource).toBe('manual');
      expect(entry?.level).toBe(3);
      expect(entry?.manualApproval).toBeDefined();
    });

    it('should update automatic detection if quest was not manually approved', () => {
      questCatalog.set('quest-auto', {
        key: 'quest-auto',
        levels: [
          { level: 1, condition: { type: 'count', min: 1 } },
          { level: 2, condition: { type: 'count', min: 5 } },
        ],
      });

      // Existing readiness with automatic detection at level 1
      const existingReadiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo-123'),
        teamId: TeamId.create('team-123'),
        computedFromScanRunId: ScanRunId.create('scan-old'),
        updatedAt: new Date('2024-01-01'),
        quests: new Map([
          [
            'quest-auto',
            {
              status: ReadinessStatus.complete(),
              level: 1,
              lastSeenAt: new Date('2024-01-01'),
              completionSource: 'automatic',
            },
          ],
        ]),
      });

      // New scan detects level 2
      const results = new Map<string, ScanResult>();
      results.set('quest-auto', ScanResult.create({ count: 7 }));
      const summary = { ...scanRunSummary, questResults: results };

      // Compute with merge
      const newReadiness = RepoReadiness.computeFromScanRun(
        summary,
        questCatalog,
        existingReadiness,
      );

      // Should update to level 2
      const entry = newReadiness.getQuestStatus('quest-auto');
      expect(entry?.level).toBe(2);
      expect(entry?.completionSource).toBe('automatic');
    });

    it('should ignore revoked manual approvals', () => {
      // Existing readiness with revoked manual approval
      const existingReadiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo-123'),
        teamId: TeamId.create('team-123'),
        computedFromScanRunId: ScanRunId.create('scan-old'),
        updatedAt: new Date('2024-01-01'),
        quests: new Map([
          [
            'quest-revoked',
            {
              status: ReadinessStatus.complete(),
              level: 1,
              lastSeenAt: new Date('2024-01-01'),
              completionSource: 'manual',
              manualApproval: {
                approvedBy: UserId.create('user_123'),
                approvedAt: new Date('2024-01-01'),
                revokedAt: new Date('2024-01-02'), // Revoked
              },
            },
          ],
        ]),
      });

      const summary = { ...scanRunSummary, questResults: new Map() };

      // Compute with merge
      const newReadiness = RepoReadiness.computeFromScanRun(
        summary,
        questCatalog,
        existingReadiness,
      );

      // Revoked quest should not be included
      const entry = newReadiness.getQuestStatus('quest-revoked');
      expect(entry).toBeUndefined();
    });

    it('should work correctly when no existing readiness provided', () => {
      questCatalog.set('quest-1', {
        key: 'quest-1',
        levels: [{ level: 1, condition: { type: 'pass' } }],
      });

      const results = new Map<string, ScanResult>();
      results.set('quest-1', ScanResult.create({ present: true }));
      const summary = { ...scanRunSummary, questResults: results };

      // No existing readiness (fresh compute)
      const readiness = RepoReadiness.computeFromScanRun(summary, questCatalog);

      const entry = readiness.getQuestStatus('quest-1');
      expect(entry).toBeDefined();
      expect(entry?.status.isComplete()).toBe(true);
      expect(entry?.completionSource).toBe('automatic');
    });
  });
});
