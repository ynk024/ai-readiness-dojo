import { describe, it, expect, vi, beforeEach } from 'vitest';

import { IngestScanRunUseCase } from '../../../src/application/use-cases/ingest-scan-run.use-case.js';
import { Repo } from '../../../src/domain/repo/repo.js';
import { ScanRun } from '../../../src/domain/scan-run/scan-run.js';
import { QuestKey } from '../../../src/domain/scan-run/scan-value-objects.js';
import {
  RepoId,
  RepoFullName,
  RepoUrl,
  TeamId,
  TeamSlug,
} from '../../../src/domain/shared/index.js';
import { Team } from '../../../src/domain/team/team.js';
import { toApplicationDto } from '../../../src/presentation/mappers/ingest-scan-run.mapper.js';

import type { RepoRepository } from '../../../src/application/ports/repo-repository.js';
import type { ScanRunRepository } from '../../../src/application/ports/scan-run-repository.js';
import type { TeamRepository } from '../../../src/application/ports/team-repository.js';
import type { IngestScanRequestDto } from '../../../src/presentation/dto/ingest-scan.dto.js';

describe('IngestScanRunUseCase', () => {
  let teamRepository: TeamRepository;
  let repoRepository: RepoRepository;
  let scanRunRepository: ScanRunRepository;
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
    // Create mock repositories
    teamRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      findBySlug: vi.fn(),
    };

    repoRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
      findByFullName: vi.fn(),
      findByTeamId: vi.fn(),
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

    useCase = new IngestScanRunUseCase(teamRepository, repoRepository, scanRunRepository);
  });

  describe('execute', () => {
    it('should ingest scan run with existing team and repo', async () => {
      // Arrange
      const teamId = TeamId.create('team_ynk024');
      const repoId = RepoId.create('repo_ynk024_workouttrackerdesign');

      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
        repoIds: [repoId],
      });

      const existingRepo = Repo.create({
        id: repoId,
        provider: 'github',
        fullName: RepoFullName.create('ynk024/Workouttrackerdesign'),
        url: RepoUrl.create('https://github.com/ynk024/Workouttrackerdesign'),
        defaultBranch: 'main',
        teamId,
        archived: false,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(existingRepo);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      // Act
      const result = await useCase.execute(toApplicationDto(sampleReport));

      // Assert
      expect(result.teamId).toBe('team_ynk024');
      expect(result.repoId).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.scanRunId).toMatch(/^scanrun_/);
      expect(result.summary.totalQuests).toBe(8);
      expect(result.summary.passedQuests).toBe(6);
      expect(result.summary.failedQuests).toBe(2);
      expect(scanRunRepository.save).toHaveBeenCalledWith(expect.any(ScanRun));
    });

    it('should create new team and repo when they do not exist', async () => {
      // Arrange
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(repoRepository.save).mockImplementation(async (repo) => repo);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      // Act
      const result = await useCase.execute(toApplicationDto(sampleReport));

      // Assert
      expect(result.teamId).toBe('team_ynk024');
      expect(result.repoId).toBe('repo_ynk024_workouttrackerdesign');
      expect(teamRepository.save).toHaveBeenCalledWith(expect.any(Team));
      expect(repoRepository.save).toHaveBeenCalledWith(expect.any(Repo));
      expect(scanRunRepository.save).toHaveBeenCalledWith(expect.any(ScanRun));
    });

    it('should create scan run with correct metadata', async () => {
      // Arrange
      const teamId = TeamId.create('team_ynk024');
      const repoId = RepoId.create('repo_ynk024_workouttrackerdesign');

      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
        repoIds: [repoId],
      });

      const existingRepo = Repo.create({
        id: repoId,
        provider: 'github',
        fullName: RepoFullName.create('ynk024/Workouttrackerdesign'),
        url: RepoUrl.create('https://github.com/ynk024/Workouttrackerdesign'),
        defaultBranch: 'main',
        teamId,
        archived: false,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(existingRepo);

      let savedScanRun: ScanRun | null = null;
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => {
        savedScanRun = scanRun;
        return scanRun;
      });

      // Act
      await useCase.execute(toApplicationDto(sampleReport));

      // Assert
      expect(savedScanRun).not.toBeNull();
      expect(savedScanRun!.teamId.equals(teamId)).toBe(true);
      expect(savedScanRun!.repoId.equals(repoId)).toBe(true);
      expect(savedScanRun!.commitSha.value).toBe('7a0137597745d539fd41e88b85779eccf118afcc');
      expect(savedScanRun!.refName).toBe('main');
      expect(savedScanRun!.providerRunId).toBe('21545800679');
      expect(savedScanRun!.runUrl).toBe(
        'https://github.com/ynk024/Workouttrackerdesign/actions/runs/21545800679',
      );
      expect(savedScanRun!.workflowVersion).toBe('1.0.0');
      expect(savedScanRun!.scannedAt.toISOString()).toBe('2026-01-31T17:39:21.414Z');
    });

    it('should create scan run with quest results from checks', async () => {
      // Arrange
      const teamId = TeamId.create('team_ynk024');
      const repoId = RepoId.create('repo_ynk024_workouttrackerdesign');

      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
        repoIds: [repoId],
      });

      const existingRepo = Repo.create({
        id: repoId,
        provider: 'github',
        fullName: RepoFullName.create('ynk024/Workouttrackerdesign'),
        url: RepoUrl.create('https://github.com/ynk024/Workouttrackerdesign'),
        defaultBranch: 'main',
        teamId,
        archived: false,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(existingRepo);

      let savedScanRun: ScanRun | null = null;
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => {
        savedScanRun = scanRun;
        return scanRun;
      });

      // Act
      await useCase.execute(toApplicationDto(sampleReport));

      // Assert
      expect(savedScanRun).not.toBeNull();
      expect(savedScanRun!.getTotalQuests()).toBe(8);
      expect(savedScanRun!.getPassedQuests().length).toBe(6);
      expect(savedScanRun!.getFailedQuests().length).toBe(2);

      // Verify specific quest results
      expect(
        savedScanRun!.getQuestStatus(QuestKey.create('docs.agents_md_present'))?.isPass(),
      ).toBe(true);
      expect(savedScanRun!.getQuestStatus(QuestKey.create('sast.semgrep_present'))?.isFail()).toBe(
        true,
      );
      expect(
        savedScanRun!.getQuestStatus(QuestKey.create('quality.coverage_threshold_met'))?.isFail(),
      ).toBe(true);
    });

    it('should generate unique scan run ID', async () => {
      // Arrange
      const teamId = TeamId.create('team_ynk024');
      const repoId = RepoId.create('repo_ynk024_workouttrackerdesign');

      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
        repoIds: [repoId],
      });

      const existingRepo = Repo.create({
        id: repoId,
        provider: 'github',
        fullName: RepoFullName.create('ynk024/Workouttrackerdesign'),
        url: RepoUrl.create('https://github.com/ynk024/Workouttrackerdesign'),
        defaultBranch: 'main',
        teamId,
        archived: false,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(existingRepo);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      // Act
      const result1 = await useCase.execute(toApplicationDto(sampleReport));
      // Add tiny delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 2));
      const result2 = await useCase.execute(toApplicationDto(sampleReport));

      // Assert
      expect(result1.scanRunId).not.toBe(result2.scanRunId);
      expect(result1.scanRunId).toMatch(/^scanrun_/);
      expect(result2.scanRunId).toMatch(/^scanrun_/);
    });

    it('should handle reports with minimal checks', async () => {
      // Arrange
      const minimalReport: IngestScanRequestDto = {
        metadata: sampleReport.metadata,
        checks: {
          documentation: {
            agents_md: { present: false },
          },
        },
      };

      const teamId = TeamId.create('team_ynk024');
      const repoId = RepoId.create('repo_ynk024_workouttrackerdesign');

      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
        repoIds: [repoId],
      });

      const existingRepo = Repo.create({
        id: repoId,
        provider: 'github',
        fullName: RepoFullName.create('ynk024/Workouttrackerdesign'),
        url: RepoUrl.create('https://github.com/ynk024/Workouttrackerdesign'),
        defaultBranch: 'main',
        teamId,
        archived: false,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(existingRepo);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      // Act
      const result = await useCase.execute(toApplicationDto(minimalReport));

      // Assert
      expect(result.summary.totalQuests).toBe(1);
      expect(result.summary.passedQuests).toBe(0);
      expect(result.summary.failedQuests).toBe(1);
    });

    it('should return summary with quest counts', async () => {
      // Arrange
      const teamId = TeamId.create('team_ynk024');
      const repoId = RepoId.create('repo_ynk024_workouttrackerdesign');

      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
        repoIds: [repoId],
      });

      const existingRepo = Repo.create({
        id: repoId,
        provider: 'github',
        fullName: RepoFullName.create('ynk024/Workouttrackerdesign'),
        url: RepoUrl.create('https://github.com/ynk024/Workouttrackerdesign'),
        defaultBranch: 'main',
        teamId,
        archived: false,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(existingRepo);
      vi.mocked(scanRunRepository.save).mockImplementation(async (scanRun) => scanRun);

      // Act
      const result = await useCase.execute(toApplicationDto(sampleReport));

      // Assert
      expect(result.summary).toEqual({
        totalQuests: 8,
        passedQuests: 6,
        failedQuests: 2,
      });
    });
  });
});
