import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ComputeRepoReadinessUseCase } from '../../../src/application/use-cases/compute-repo-readiness.use-case.js';
import { IngestScanRunUseCase } from '../../../src/application/use-cases/ingest-scan-run.use-case.js';
import { ScanRun } from '../../../src/domain/scan-run/scan-run.js';
import {
  RepoId,
  RepoFullName,
  RepoUrl,
  TeamId,
  TeamSlug,
} from '../../../src/domain/shared/index.js';
import { Team } from '../../../src/domain/team/team.js';
import { toApplicationDto } from '../../../src/presentation/mappers/ingest-scan-run.mapper.js';

import type { ScanRunRepository } from '../../../src/application/ports/scan-run-repository.js';
import type { TeamRepository } from '../../../src/application/ports/team-repository.js';
import type { IngestScanRequestDto } from '../../../src/presentation/dto/ingest-scan.dto.js';

describe('IngestScanRunUseCase', () => {
  let teamRepository: TeamRepository;
  let scanRunRepository: ScanRunRepository;
  let computeRepoReadinessUseCase: ComputeRepoReadinessUseCase;
  let useCase: IngestScanRunUseCase;

  const sampleReport: IngestScanRequestDto = {
    metadata: {
      repository: {
        name: 'ynk024/Workouttrackerdesign',
        url: 'https://github.com/ynk024/Workouttrackerdesign',
        commit_sha: '7a0137597745d539fd41e88b85779eccf118afcc',
        branch: 'main',
        run_id: '21545800679',
        run_url: 'https://github.com/ynk024/Workouttrackerdesign/actions/runs/21545800679',
      },
      timestamp: '2026-01-31T17:39:21.414Z',
      workflow_version: '1.0.0',
    },
    checks: {
      documentation: {
        agents_md: { present: true },
        skill_md: { count: 1 },
      },
      formatters: {
        javascript: { prettier: { present: true } },
      },
      linting: {
        javascript: { eslint: { present: true } },
      },
      sast: {
        codeql: { present: true },
        semgrep: { present: false },
      },
      test_coverage: {
        available: true,
        meets_threshold: false,
      },
    },
  };

  beforeEach(() => {
    teamRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      findBySlug: vi.fn(),
    };

    scanRunRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      findByRepoId: vi.fn(),
      findLatestByRepoId: vi.fn(),
    };

    computeRepoReadinessUseCase = {
      execute: vi.fn().mockResolvedValue({
        repoId: { value: 'repo_id' },
        teamId: { value: 'team_id' },
        scanRunId: { value: 'scan_id' },
        scannedAt: new Date(),
        quests: new Map(),
        getTotalQuests: () => 8,
        getCompletedQuests: () => Array(6).fill({}) as unknown[],
        getIncompleteQuests: () => Array(2).fill({}) as unknown[],
        getForQuest: () => undefined,
        getCompletionPercentage: () => 75,
      }),
    } as unknown as ComputeRepoReadinessUseCase;

    useCase = new IngestScanRunUseCase(
      teamRepository,
      scanRunRepository,
      computeRepoReadinessUseCase,
    );
  });

  describe('execute', () => {
    it('should ingest scan run with existing team and repo', async () => {
      const teamId = TeamId.create('team_ynk024');
      const repoId = RepoId.create('repo_ynk024_workouttrackerdesign');

      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
      });

      existingTeam.addRepo({
        id: repoId,
        provider: 'github',
        fullName: RepoFullName.create('ynk024/Workouttrackerdesign'),
        url: RepoUrl.create('https://github.com/ynk024/Workouttrackerdesign'),
        defaultBranch: 'main',
        teamId,
        archived: false,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      const result = await useCase.execute(toApplicationDto(sampleReport));

      expect(result.teamId).toBe('team_ynk024');
      expect(result.repoId).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.scanRunId).toMatch(/^scanrun_/);
      expect(result.summary.totalQuests).toBe(8);
      expect(result.summary.passedQuests).toBe(6);
      expect(result.summary.failedQuests).toBe(2);
      expect(scanRunRepository.save).toHaveBeenCalledWith(expect.any(ScanRun));
    });

    it('should create new team and repo when they do not exist', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      const result = await useCase.execute(toApplicationDto(sampleReport));

      expect(result.teamId).toBe('team_ynk024');
      expect(result.repoId).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.scanRunId).toMatch(/^scanrun_/);
      expect(teamRepository.save).toHaveBeenCalled();
    });

    it('should generate unique scan run IDs', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      const result1 = await useCase.execute(toApplicationDto(sampleReport));
      await new Promise((resolve) => setTimeout(resolve, 10));
      const result2 = await useCase.execute(toApplicationDto(sampleReport));

      expect(result1.scanRunId).not.toBe(result2.scanRunId);
      expect(result1.scanRunId).toMatch(/^scanrun_21545800679_\d+/);
      expect(result2.scanRunId).toMatch(/^scanrun_21545800679_\d+/);
    });

    it('should create ScanRun with correct data', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      const result = await useCase.execute(toApplicationDto(sampleReport));

      expect(result.teamId).toBe('team_ynk024');
      expect(result.repoId).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.summary.totalQuests).toBe(8);
    });

    it('should count passed and failed quests correctly', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      const result = await useCase.execute(toApplicationDto(sampleReport));

      expect(result.summary.passedQuests).toBe(6);
      expect(result.summary.failedQuests).toBe(2);
    });

    it('should compute and persist repo readiness', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      await useCase.execute(toApplicationDto(sampleReport));

      expect(computeRepoReadinessUseCase.execute).toHaveBeenCalled();
    });

    it('should return summary with quest counts', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      const result = await useCase.execute(toApplicationDto(sampleReport));

      expect(result.summary).toEqual({
        totalQuests: expect.any(Number),
        passedQuests: expect.any(Number),
        failedQuests: expect.any(Number),
      });
      expect(result.summary.totalQuests).toBeGreaterThan(0);
    });
  });
});
