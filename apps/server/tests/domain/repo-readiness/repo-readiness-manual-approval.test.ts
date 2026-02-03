import { describe, it, expect } from 'vitest';

import { ReadinessStatus } from '../../../src/domain/repo-readiness/repo-readiness-value-objects.js';
import { RepoReadiness } from '../../../src/domain/repo-readiness/repo-readiness.js';
import { ScanRunId } from '../../../src/domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId, UserId } from '../../../src/domain/shared/index.js';
import { BusinessRuleViolationError } from '../../../src/shared/errors/domain-errors.js';

describe('RepoReadiness - Manual Approval', () => {
  const createEmptyReadiness = (): RepoReadiness => {
    return RepoReadiness.reconstitute({
      repoId: RepoId.create('repo-123'),
      teamId: TeamId.create('team-123'),
      computedFromScanRunId: ScanRunId.create('scan-123'),
      updatedAt: new Date('2024-01-01'),
      quests: new Map(),
    });
  };

  describe('createEmpty', () => {
    it('should create an empty readiness snapshot initialized for manual approval', () => {
      const repoId = RepoId.create('repo-123');
      const teamId = TeamId.create('team-123');

      const readiness = RepoReadiness.createEmpty(repoId, teamId);

      expect(readiness.repoId.equals(repoId)).toBe(true);
      expect(readiness.teamId.equals(teamId)).toBe(true);
      expect(readiness.computedFromScanRunId.value).toBe('manual_approval');
      expect(readiness.quests.size).toBe(0);
      expect(readiness.updatedAt).toBeInstanceOf(Date);
      // Ensure it's a recent date
      expect(readiness.updatedAt.getTime()).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('approveQuestManually', () => {
    it('should manually approve a quest with level 1 by default', () => {
      const readiness = createEmptyReadiness();
      const userId = UserId.create('user_123');

      readiness.approveQuestManually('quest-manual', userId);

      const entry = readiness.getQuestStatus('quest-manual');
      expect(entry).toBeDefined();
      expect(entry?.status.isComplete()).toBe(true);
      expect(entry?.level).toBe(1);
      expect(entry?.completionSource).toBe('manual');
      expect(entry?.manualApproval?.approvedBy.equals(userId)).toBe(true);
      expect(entry?.manualApproval?.approvedAt).toBeInstanceOf(Date);
      expect(entry?.manualApproval?.revokedAt).toBeUndefined();
    });

    it('should manually approve a quest with specified level', () => {
      const readiness = createEmptyReadiness();
      const userId = UserId.create('user_123');

      readiness.approveQuestManually('quest-manual', userId, 3);

      const entry = readiness.getQuestStatus('quest-manual');
      expect(entry?.level).toBe(3);
    });

    it('should override existing automatic detection with manual approval', () => {
      const readiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo-123'),
        teamId: TeamId.create('team-123'),
        computedFromScanRunId: ScanRunId.create('scan-123'),
        updatedAt: new Date('2024-01-01'),
        quests: new Map([
          [
            'quest-1',
            {
              status: ReadinessStatus.incomplete(),
              level: 1,
              lastSeenAt: new Date('2024-01-01'),
              completionSource: 'automatic',
            },
          ],
        ]),
      });

      const userId = UserId.create('user_123');
      readiness.approveQuestManually('quest-1', userId, 2);

      const entry = readiness.getQuestStatus('quest-1');
      expect(entry?.completionSource).toBe('manual');
      expect(entry?.status.isComplete()).toBe(true);
      expect(entry?.level).toBe(2);
    });

    it('should update manual approval if quest was already manually approved', () => {
      const firstUserId = UserId.create('user_123');
      const secondUserId = UserId.create('user_456');
      const readiness = createEmptyReadiness();

      readiness.approveQuestManually('quest-1', firstUserId, 1);
      const firstApproval = readiness.getQuestStatus('quest-1');

      // Approve again with different user and level
      readiness.approveQuestManually('quest-1', secondUserId, 3);
      const secondApproval = readiness.getQuestStatus('quest-1');

      expect(secondApproval?.level).toBe(3);
      expect(secondApproval?.manualApproval?.approvedBy.equals(secondUserId)).toBe(true);
      // Timestamp should be equal or greater (same instant is possible)
      expect(secondApproval?.manualApproval?.approvedAt.getTime()).toBeGreaterThanOrEqual(
        firstApproval?.manualApproval?.approvedAt.getTime() ?? 0,
      );
    });

    it('should update the readiness updatedAt timestamp', () => {
      const readiness = createEmptyReadiness();
      const originalUpdatedAt = readiness.updatedAt;

      // Small delay to ensure different timestamp
      const beforeApproval = new Date();
      readiness.approveQuestManually('quest-1', UserId.create('user_123'));

      expect(readiness.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeApproval.getTime());
      expect(readiness.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('revokeManualApproval', () => {
    it('should revoke a manually approved quest', () => {
      const readiness = createEmptyReadiness();
      const userId = UserId.create('user_123');

      readiness.approveQuestManually('quest-1', userId);
      expect(readiness.getQuestStatus('quest-1')).toBeDefined();

      readiness.revokeManualApproval('quest-1');
      expect(readiness.getQuestStatus('quest-1')).toBeUndefined();
    });

    it('should throw error when revoking non-existent quest', () => {
      const readiness = createEmptyReadiness();

      expect(() => {
        readiness.revokeManualApproval('non-existent');
      }).toThrow(BusinessRuleViolationError);
      expect(() => {
        readiness.revokeManualApproval('non-existent');
      }).toThrow('Cannot revoke non-manually approved quest');
    });

    it('should throw error when revoking automatically detected quest', () => {
      const readiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo-123'),
        teamId: TeamId.create('team-123'),
        computedFromScanRunId: ScanRunId.create('scan-123'),
        updatedAt: new Date(),
        quests: new Map([
          [
            'quest-auto',
            {
              status: ReadinessStatus.complete(),
              level: 1,
              lastSeenAt: new Date(),
              completionSource: 'automatic',
            },
          ],
        ]),
      });

      expect(() => {
        readiness.revokeManualApproval('quest-auto');
      }).toThrow(BusinessRuleViolationError);
      expect(() => {
        readiness.revokeManualApproval('quest-auto');
      }).toThrow('Cannot revoke non-manually approved quest');
    });

    it('should update the readiness updatedAt timestamp', () => {
      const readiness = createEmptyReadiness();
      readiness.approveQuestManually('quest-1', UserId.create('user_123'));

      const beforeRevoke = new Date();
      readiness.revokeManualApproval('quest-1');

      expect(readiness.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeRevoke.getTime());
    });
  });
});
