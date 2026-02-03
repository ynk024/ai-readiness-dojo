import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ComputeRepoReadinessUseCase } from '../../../src/application/use-cases/compute-repo-readiness.use-case.js';
import { QuestId, QuestDetectionType } from '../../../src/domain/quest/index.js';
import { Quest } from '../../../src/domain/quest/quest.js';
import { RepoReadiness } from '../../../src/domain/repo-readiness/repo-readiness.js';
import { ScanRun } from '../../../src/domain/scan-run/scan-run.js';
import {
  ScanRunId,
  CommitSha,
  ScanResult,
} from '../../../src/domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId, UserId } from '../../../src/domain/shared/index.js';

import type { QuestRepository } from '../../../src/application/ports/quest-repository.js';
import type { RepoReadinessRepository } from '../../../src/application/ports/repo-readiness-repository.js';

describe('ComputeRepoReadinessUseCase', () => {
  let questRepository: QuestRepository;
  let repoReadinessRepository: RepoReadinessRepository;
  let useCase: ComputeRepoReadinessUseCase;

  const repoId = RepoId.create('repo_test');
  const teamId = TeamId.create('team_test');

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

    useCase = new ComputeRepoReadinessUseCase(questRepository, repoReadinessRepository);
  });

  describe('execute with manual approval preservation', () => {
    it('should preserve manual approvals when computing from new scan', async () => {
      // Create quests - one auto-only, one that allows both
      const autoQuest = Quest.create({
        id: QuestId.create('quest_auto'),
        key: 'quest_auto',
        title: 'Auto Quest',
        description: 'Auto-detected quest',
        category: 'testing',
        detectionType: QuestDetectionType.autoOnly(),
        active: true,
        levels: [{ level: 1, description: 'Basic', condition: { type: 'pass' } }],
      });

      const bothQuest = Quest.create({
        id: QuestId.create('quest_both'),
        key: 'quest_both',
        title: 'Both Quest',
        description: 'Quest that allows both auto and manual',
        category: 'testing',
        detectionType: QuestDetectionType.both(),
        active: true,
        levels: [{ level: 1, description: 'Basic', condition: { type: 'pass' } }],
      });

      vi.mocked(questRepository.findActiveByLanguage).mockResolvedValue([autoQuest, bothQuest]);

      // Create existing readiness with a manual approval
      const existingReadiness = RepoReadiness.reconstitute({
        repoId,
        teamId,
        computedFromScanRunId: ScanRunId.create('scan_old'),
        updatedAt: new Date('2024-01-01'),
        quests: new Map(),
      });
      existingReadiness.approveQuestManually('quest_manual', UserId.create('user_123'), 2);

      vi.mocked(repoReadinessRepository.findByRepoId).mockResolvedValue(existingReadiness);
      vi.mocked(repoReadinessRepository.save).mockImplementation(async (readiness) => readiness);

      // Create a new scan run with automatic quest results
      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_new'),
        teamId,
        repoId,
        commitSha: CommitSha.create('abc1234'),
        refName: 'main',
        providerRunId: 'run_123',
        runUrl: 'https://example.com',
        workflowVersion: '1.0.0',
        scannedAt: new Date(),
        questResults: new Map([['quest_auto', ScanResult.create({ passed: true })]]),
      });

      const result = await useCase.execute(scanRun, null);

      // Verify manual approval is preserved
      const manualEntry = result.getQuestStatus('quest_manual');
      expect(manualEntry).toBeDefined();
      expect(manualEntry?.completionSource).toBe('manual');
      expect(manualEntry?.manualApproval?.approvedBy).toEqual(UserId.create('user_123'));

      // Verify automatic quest is detected
      const autoEntry = result.getQuestStatus('quest_auto');
      expect(autoEntry).toBeDefined();
      expect(autoEntry?.completionSource).toBe('automatic');

      expect(repoReadinessRepository.save).toHaveBeenCalledWith(result);
    });

    it('should only filter quests that can be auto-detected when computing readiness', async () => {
      // Create quests with different detection types
      const autoOnlyQuest = Quest.create({
        id: QuestId.create('quest_auto_only'),
        key: 'quest_auto_only',
        title: 'Auto Only Quest',
        description: 'Can only be auto-detected',
        category: 'testing',
        detectionType: QuestDetectionType.autoOnly(),
        active: true,
        levels: [{ level: 1, description: 'Basic', condition: { type: 'pass' } }],
      });

      const manualOnlyQuest = Quest.create({
        id: QuestId.create('quest_manual_only'),
        key: 'quest_manual_only',
        title: 'Manual Only Quest',
        description: 'Can only be manually approved',
        category: 'testing',
        detectionType: QuestDetectionType.manualOnly(),
        active: true,
        levels: [{ level: 1, description: 'Basic', condition: { type: 'pass' } }],
      });

      const bothQuest = Quest.create({
        id: QuestId.create('quest_both'),
        key: 'quest_both',
        title: 'Both Quest',
        description: 'Can be both auto-detected and manually approved',
        category: 'testing',
        detectionType: QuestDetectionType.both(),
        active: true,
        levels: [{ level: 1, description: 'Basic', condition: { type: 'pass' } }],
      });

      vi.mocked(questRepository.findActiveByLanguage).mockResolvedValue([
        autoOnlyQuest,
        manualOnlyQuest,
        bothQuest,
      ]);

      vi.mocked(repoReadinessRepository.findByRepoId).mockResolvedValue(null);
      vi.mocked(repoReadinessRepository.save).mockImplementation(async (readiness) => readiness);

      // Create scan run with all three quest results
      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_new'),
        teamId,
        repoId,
        commitSha: CommitSha.create('abc1234'),
        refName: 'main',
        providerRunId: 'run_123',
        runUrl: 'https://example.com',
        workflowVersion: '1.0.0',
        scannedAt: new Date(),
        questResults: new Map([
          ['quest_auto_only', ScanResult.create({ passed: true })],
          ['quest_manual_only', ScanResult.create({ passed: true })],
          ['quest_both', ScanResult.create({ passed: true })],
        ]),
      });

      const result = await useCase.execute(scanRun, null);

      // Only auto-only and both quests should be detected automatically
      const autoOnlyEntry = result.getQuestStatus('quest_auto_only');
      expect(autoOnlyEntry).toBeDefined();
      expect(autoOnlyEntry?.completionSource).toBe('automatic');

      const bothEntry = result.getQuestStatus('quest_both');
      expect(bothEntry).toBeDefined();
      expect(bothEntry?.completionSource).toBe('automatic');

      // Manual-only quest should NOT be detected automatically
      const manualOnlyEntry = result.getQuestStatus('quest_manual_only');
      expect(manualOnlyEntry).toBeUndefined();
    });

    it('should create new readiness when no existing readiness exists', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'quest_auto',
        title: 'Auto Quest',
        description: 'Auto-detected quest',
        category: 'testing',
        detectionType: QuestDetectionType.autoOnly(),
        active: true,
        levels: [{ level: 1, description: 'Basic', condition: { type: 'pass' } }],
      });

      vi.mocked(questRepository.findActiveByLanguage).mockResolvedValue([quest]);
      vi.mocked(repoReadinessRepository.findByRepoId).mockResolvedValue(null);
      vi.mocked(repoReadinessRepository.save).mockImplementation(async (readiness) => readiness);

      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_new'),
        teamId,
        repoId,
        commitSha: CommitSha.create('abc1234'),
        refName: 'main',
        providerRunId: 'run_123',
        runUrl: 'https://example.com',
        workflowVersion: '1.0.0',
        scannedAt: new Date(),
        questResults: new Map([['quest_auto', ScanResult.create({ passed: true })]]),
      });

      const result = await useCase.execute(scanRun, null);

      expect(result).toBeDefined();
      expect(result.repoId).toEqual(repoId);
      expect(repoReadinessRepository.save).toHaveBeenCalled();
    });
  });
});
