import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ApproveQuestManuallyUseCase } from '../../../src/application/use-cases/approve-quest-manually.use-case.js';
import { QuestId, QuestDetectionType } from '../../../src/domain/quest/index.js';
import { Quest } from '../../../src/domain/quest/quest.js';
import { RepoReadiness } from '../../../src/domain/repo-readiness/repo-readiness.js';
import { ScanRunId } from '../../../src/domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId } from '../../../src/domain/shared/index.js';
import { UserId } from '../../../src/domain/shared/user-types.js';
import { Team } from '../../../src/domain/team/team.js';
import { BusinessRuleViolationError } from '../../../src/shared/errors/domain-errors.js';

import type { QuestRepository } from '../../../src/application/ports/quest-repository.js';
import type { RepoReadinessRepository } from '../../../src/application/ports/repo-readiness-repository.js';
import type { TeamRepository } from '../../../src/application/ports/team-repository.js';

describe('ApproveQuestManuallyUseCase', () => {
  let questRepository: QuestRepository;
  let teamRepository: TeamRepository;
  let repoReadinessRepository: RepoReadinessRepository;
  let useCase: ApproveQuestManuallyUseCase;

  const repoId = RepoId.create('repo_test');
  const teamId = TeamId.create('team_test');
  const userId = UserId.create('user_test');
  const questKey = 'quest_001';

  beforeEach(() => {
    questRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      findByKey: vi.fn(),
      findByCategory: vi.fn(),
      findActive: vi.fn(),
      findActiveByLanguage: vi.fn(),
    };

    teamRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      findBySlug: vi.fn(),
    };

    repoReadinessRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      findByRepoId: vi.fn(),
      findByTeamId: vi.fn(),
    };

    useCase = new ApproveQuestManuallyUseCase(
      questRepository,
      teamRepository,
      repoReadinessRepository,
    );
  });

  describe('execute', () => {
    it('should manually approve a quest when repo and quest exist and quest allows manual approval', async () => {
      // Arrange: Create a quest that allows manual approval
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: questKey,
        title: 'Test Quest',
        description: 'A test quest',
        category: 'testing',
        detectionType: QuestDetectionType.both(),
        active: true,
        levels: [
          { level: 1, description: 'Bronze', condition: { type: 'pass' } },
          { level: 2, description: 'Silver', condition: { type: 'pass' } },
          { level: 3, description: 'Gold', condition: { type: 'pass' } },
        ],
      });

      const team = {
        id: teamId,
        hasRepo: vi.fn().mockReturnValue(true),
        getRepo: vi.fn().mockReturnValue({}),
      } as unknown as Team;
      vi.mocked(teamRepository.findById).mockResolvedValue(team);

      vi.mocked(teamRepository.exists).mockResolvedValue(true);
      vi.mocked(questRepository.findByKey).mockResolvedValue(quest);
      vi.mocked(repoReadinessRepository.findByRepoId).mockResolvedValue(null);
      vi.mocked(repoReadinessRepository.save).mockImplementation(async (readiness) => readiness);

      // Act
      const result = await useCase.execute({
        repoId,
        teamId,
        questKey,
        approvedBy: userId,
        level: 1,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.repoId).toEqual(repoId);
      const questReadiness = result.getQuestStatus(questKey);
      expect(questReadiness).toBeDefined();
      expect(questReadiness?.level).toBe(1);
      expect(questReadiness?.completionSource).toBe('manual');
      expect(questReadiness?.manualApproval).toBeDefined();
      expect(questReadiness?.manualApproval?.approvedBy).toEqual(userId);
      expect(repoReadinessRepository.save).toHaveBeenCalledWith(result);
    });

    it('should use default gold level (3) when no level specified', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: questKey,
        title: 'Test Quest',
        description: 'A test quest',
        category: 'testing',
        detectionType: QuestDetectionType.both(),
        active: true,
        levels: [
          { level: 1, description: 'Bronze', condition: { type: 'pass' } },
          { level: 2, description: 'Silver', condition: { type: 'pass' } },
          { level: 3, description: 'Gold', condition: { type: 'pass' } },
        ],
      });

      const team = {
        id: teamId,
        hasRepo: vi.fn().mockReturnValue(true),
        getRepo: vi.fn().mockReturnValue({}),
      } as unknown as Team;
      vi.mocked(teamRepository.findById).mockResolvedValue(team);

      vi.mocked(teamRepository.exists).mockResolvedValue(true);
      vi.mocked(questRepository.findByKey).mockResolvedValue(quest);
      vi.mocked(repoReadinessRepository.findByRepoId).mockResolvedValue(null);
      vi.mocked(repoReadinessRepository.save).mockImplementation(async (readiness) => readiness);

      const result = await useCase.execute({
        repoId,
        teamId,
        questKey,
        approvedBy: userId,
      });

      const questReadiness = result.getQuestStatus(questKey);
      expect(questReadiness?.level).toBe(3);
    });

    it('should preserve existing manual approval when approving again', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: questKey,
        title: 'Test Quest',
        description: 'A test quest',
        category: 'testing',
        detectionType: QuestDetectionType.both(),
        active: true,
        levels: [
          { level: 1, description: 'Bronze', condition: { type: 'pass' } },
          { level: 2, description: 'Silver', condition: { type: 'pass' } },
          { level: 3, description: 'Gold', condition: { type: 'pass' } },
        ],
      });

      const existingReadiness = RepoReadiness.reconstitute({
        repoId,
        teamId,
        computedFromScanRunId: ScanRunId.create('scan_001'),
        updatedAt: new Date(),
        quests: new Map(),
      });

      const firstUser = UserId.create('user_first');
      existingReadiness.approveQuestManually(questKey, firstUser, 1);

      const team = {
        id: teamId,
        hasRepo: vi.fn().mockReturnValue(true),
        getRepo: vi.fn().mockReturnValue({}),
      } as unknown as Team;
      vi.mocked(teamRepository.findById).mockResolvedValue(team);

      vi.mocked(teamRepository.exists).mockResolvedValue(true);
      vi.mocked(questRepository.findByKey).mockResolvedValue(quest);
      vi.mocked(repoReadinessRepository.findByRepoId).mockResolvedValue(existingReadiness);
      vi.mocked(repoReadinessRepository.save).mockImplementation(async (readiness) => readiness);

      const secondUser = UserId.create('user_second');
      const result = await useCase.execute({
        repoId,
        teamId,
        questKey,
        approvedBy: secondUser,
        level: 3,
      });

      const questReadiness = result.getQuestStatus(questKey);
      expect(questReadiness?.level).toBe(3);
      expect(questReadiness?.manualApproval?.approvedBy).toEqual(secondUser);
    });

    it('should throw error when team does not exist', async () => {
      vi.mocked(teamRepository.findById).mockResolvedValue(null);
      vi.mocked(teamRepository.exists).mockResolvedValue(false);

      await expect(
        useCase.execute({
          repoId,
          teamId,
          questKey,
          approvedBy: userId,
        }),
      ).rejects.toThrow('Team not found');
    });

    it('should throw error when quest does not exist', async () => {
      const team = {
        id: teamId,
        hasRepo: vi.fn().mockReturnValue(true),
        getRepo: vi.fn().mockReturnValue({}),
      } as unknown as Team;
      vi.mocked(teamRepository.findById).mockResolvedValue(team);

      vi.mocked(teamRepository.exists).mockResolvedValue(true);
      vi.mocked(questRepository.findByKey).mockResolvedValue(null);

      await expect(
        useCase.execute({
          repoId,
          teamId,
          questKey,
          approvedBy: userId,
        }),
      ).rejects.toThrow('Quest not found');
    });

    it('should throw error when quest does not allow manual approval', async () => {
      const autoOnlyQuest = Quest.create({
        id: QuestId.create('quest_123'),
        key: questKey,
        title: 'Auto-only Quest',
        description: 'A quest that cannot be manually approved',
        category: 'testing',
        detectionType: QuestDetectionType.autoOnly(),
        active: true,
        levels: [
          { level: 1, description: 'Bronze', condition: { type: 'pass' } },
          { level: 2, description: 'Silver', condition: { type: 'pass' } },
          { level: 3, description: 'Gold', condition: { type: 'pass' } },
        ],
      });

      const team = {
        id: teamId,
        hasRepo: vi.fn().mockReturnValue(true),
        getRepo: vi.fn().mockReturnValue({}),
      } as unknown as Team;
      vi.mocked(teamRepository.findById).mockResolvedValue(team);

      vi.mocked(teamRepository.exists).mockResolvedValue(true);
      vi.mocked(questRepository.findByKey).mockResolvedValue(autoOnlyQuest);

      await expect(
        useCase.execute({
          repoId,
          teamId,
          questKey,
          approvedBy: userId,
        }),
      ).rejects.toThrow(BusinessRuleViolationError);
      await expect(
        useCase.execute({
          repoId,
          teamId,
          questKey,
          approvedBy: userId,
        }),
      ).rejects.toThrow('Quest does not allow manual approval');
    });

    it('should throw error when repo does not belong to team', async () => {
      vi.mocked(teamRepository.exists).mockResolvedValue(true);
      const team = {
        id: teamId,
        hasRepo: vi.fn().mockReturnValue(false),
        getRepo: vi.fn().mockReturnValue(undefined),
      } as unknown as Team;
      vi.mocked(teamRepository.findById).mockResolvedValue(team);

      await expect(
        useCase.execute({
          repoId,
          teamId,
          questKey,
          approvedBy: userId,
        }),
      ).rejects.toThrow('Repo not found in team');
    });

    it('should create new readiness snapshot when none exists', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: questKey,
        title: 'Test Quest',
        description: 'A test quest',
        category: 'testing',
        detectionType: QuestDetectionType.both(),
        active: true,
        levels: [
          { level: 1, description: 'Bronze', condition: { type: 'pass' } },
          { level: 2, description: 'Silver', condition: { type: 'pass' } },
          { level: 3, description: 'Gold', condition: { type: 'pass' } },
        ],
      });

      const team = {
        id: teamId,
        hasRepo: vi.fn().mockReturnValue(true),
        getRepo: vi.fn().mockReturnValue({}),
      } as unknown as Team;
      vi.mocked(teamRepository.findById).mockResolvedValue(team);

      vi.mocked(teamRepository.exists).mockResolvedValue(true);
      vi.mocked(questRepository.findByKey).mockResolvedValue(quest);
      vi.mocked(repoReadinessRepository.findByRepoId).mockResolvedValue(null);
      vi.mocked(repoReadinessRepository.save).mockImplementation(async (readiness) => readiness);

      const result = await useCase.execute({
        repoId,
        teamId,
        questKey,
        approvedBy: userId,
      });

      expect(result).toBeDefined();
      expect(result.repoId).toEqual(repoId);
      expect(result.teamId).toEqual(teamId);
      expect(repoReadinessRepository.save).toHaveBeenCalled();
    });
  });
});
