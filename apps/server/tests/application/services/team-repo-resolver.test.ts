import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TeamRepoResolver } from '../../../src/application/services/team-repo-resolver.js';
import { Repo } from '../../../src/domain/repo/repo.js';
import {
  RepoId,
  RepoFullName,
  RepoUrl,
  TeamId,
  TeamSlug,
} from '../../../src/domain/shared/index.js';
import { Team } from '../../../src/domain/team/team.js';

import type { RepoMetadata } from '../../../src/application/dto/repo-metadata.dto.js';
import type { RepoRepository } from '../../../src/application/ports/repo-repository.js';
import type { TeamRepository } from '../../../src/application/ports/team-repository.js';

describe('TeamRepoResolver', () => {
  let teamRepository: TeamRepository;
  let repoRepository: RepoRepository;
  let resolver: TeamRepoResolver;

  const sampleMetadata: RepoMetadata = {
    owner: 'ynk024',
    name: 'Workouttrackerdesign',
    fullName: 'ynk024/Workouttrackerdesign',
    url: 'https://github.com/ynk024/Workouttrackerdesign',
    commitSha: '7a0137597745d539fd41e88b85779eccf118afcc',
    refName: 'main',
    providerRunId: '21545800679',
    runUrl: 'https://github.com/ynk024/Workouttrackerdesign/actions/runs/21545800679',
    workflowVersion: '1.0.0',
    scannedAt: new Date('2026-01-31T17:39:21.414Z'),
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

    resolver = new TeamRepoResolver(teamRepository, repoRepository);
  });

  describe('resolveFromMetadata', () => {
    it('should return existing team and repo if both exist', async () => {
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

      // Act
      const result = await resolver.resolveFromMetadata(sampleMetadata);

      // Assert
      expect(result.team).toBe(existingTeam);
      expect(result.repo).toBe(existingRepo);
      expect(teamRepository.findBySlug).toHaveBeenCalledWith(TeamSlug.create('ynk024'));
      expect(repoRepository.findByFullName).toHaveBeenCalledWith(
        RepoFullName.create('ynk024/Workouttrackerdesign'),
      );
      expect(teamRepository.save).not.toHaveBeenCalled();
      expect(repoRepository.save).not.toHaveBeenCalled();
    });

    it('should create new team if it does not exist', async () => {
      // Arrange
      const repoId = RepoId.create('repo_ynk024_workouttrackerdesign');
      const existingRepo = Repo.create({
        id: repoId,
        provider: 'github',
        fullName: RepoFullName.create('ynk024/Workouttrackerdesign'),
        url: RepoUrl.create('https://github.com/ynk024/Workouttrackerdesign'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_ynk024'),
        archived: false,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(existingRepo);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      // Act
      const result = await resolver.resolveFromMetadata(sampleMetadata);

      // Assert
      expect(result.team.name).toBe('ynk024');
      expect(result.team.slug.value).toBe('ynk024');
      expect(result.team.id.value).toBe('team_ynk024');
      expect(result.repo).toBe(existingRepo);
      expect(teamRepository.save).toHaveBeenCalledWith(expect.any(Team));
    });

    it('should create new repo if it does not exist', async () => {
      // Arrange
      const teamId = TeamId.create('team_ynk024');
      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
        repoIds: [],
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(null);
      vi.mocked(repoRepository.save).mockImplementation(async (repo) => repo);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      // Act
      const result = await resolver.resolveFromMetadata(sampleMetadata);

      // Assert
      expect(result.team).toBe(existingTeam);
      expect(result.repo.id.value).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.repo.fullName.value).toBe('ynk024/Workouttrackerdesign');
      expect(result.repo.url.value).toBe('https://github.com/ynk024/Workouttrackerdesign');
      expect(result.repo.defaultBranch).toBe('main');
      expect(result.repo.teamId.equals(teamId)).toBe(true);
      expect(repoRepository.save).toHaveBeenCalledWith(expect.any(Repo));
    });

    it('should create both team and repo if neither exist', async () => {
      // Arrange
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(repoRepository.save).mockImplementation(async (repo) => repo);

      // Act
      const result = await resolver.resolveFromMetadata(sampleMetadata);

      // Assert
      expect(result.team.name).toBe('ynk024');
      expect(result.team.slug.value).toBe('ynk024');
      expect(result.team.id.value).toBe('team_ynk024');
      expect(result.repo.id.value).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.repo.fullName.value).toBe('ynk024/Workouttrackerdesign');
      expect(teamRepository.save).toHaveBeenCalledWith(expect.any(Team));
      expect(repoRepository.save).toHaveBeenCalledWith(expect.any(Repo));
    });

    it('should link repo to team when creating new repo', async () => {
      // Arrange
      const teamId = TeamId.create('team_ynk024');
      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
        repoIds: [],
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(null);
      vi.mocked(repoRepository.save).mockImplementation(async (repo) => repo);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      // Act
      const result = await resolver.resolveFromMetadata(sampleMetadata);

      // Assert
      expect(result.team.hasRepo(result.repo.id)).toBe(true);
      expect(result.team.getRepoCount()).toBe(1);
      // Verify team was saved after adding repo
      expect(teamRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should not duplicate repo in team if repo already linked', async () => {
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

      // Act
      const result = await resolver.resolveFromMetadata(sampleMetadata);

      // Assert
      expect(result.team.getRepoCount()).toBe(1);
      expect(teamRepository.save).not.toHaveBeenCalled();
    });

    it('should normalize owner to lowercase for slug', async () => {
      // Arrange
      const metadataWithUpperCase: RepoMetadata = {
        ...sampleMetadata,
        owner: 'YNK024',
        fullName: 'YNK024/Workouttrackerdesign',
      };

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(repoRepository.save).mockImplementation(async (repo) => repo);

      // Act
      const result = await resolver.resolveFromMetadata(metadataWithUpperCase);

      // Assert
      expect(result.team.slug.value).toBe('ynk024');
      expect(result.team.id.value).toBe('team_ynk024');
    });

    it('should use github as default provider', async () => {
      // Arrange
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(repoRepository.save).mockImplementation(async (repo) => repo);

      // Act
      const result = await resolver.resolveFromMetadata(sampleMetadata);

      // Assert
      expect(result.repo.provider).toBe('github');
    });

    it('should use refName as default branch', async () => {
      // Arrange
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(repoRepository.save).mockImplementation(async (repo) => repo);

      // Act
      const result = await resolver.resolveFromMetadata(sampleMetadata);

      // Assert
      expect(result.repo.defaultBranch).toBe('main');
    });

    it('should handle refs/heads/ prefix in branch name', async () => {
      // Arrange
      const metadataWithRef: RepoMetadata = {
        ...sampleMetadata,
        refName: 'refs/heads/feature-branch',
      };

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(repoRepository.findByFullName).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);
      vi.mocked(repoRepository.save).mockImplementation(async (repo) => repo);

      // Act
      const result = await resolver.resolveFromMetadata(metadataWithRef);

      // Assert
      expect(result.repo.defaultBranch).toBe('feature-branch');
    });
  });

  describe('generateTeamId', () => {
    it('should generate team ID from owner', () => {
      const teamId = TeamRepoResolver.generateTeamId('ynk024');
      expect(teamId.value).toBe('team_ynk024');
    });

    it('should lowercase owner for team ID', () => {
      const teamId = TeamRepoResolver.generateTeamId('YNK024');
      expect(teamId.value).toBe('team_ynk024');
    });
  });

  describe('generateRepoId', () => {
    it('should generate repo ID from owner and name', () => {
      const repoId = TeamRepoResolver.generateRepoId('ynk024', 'Workouttrackerdesign');
      expect(repoId.value).toBe('repo_ynk024_workouttrackerdesign');
    });

    it('should lowercase both owner and name for repo ID', () => {
      const repoId = TeamRepoResolver.generateRepoId('YNK024', 'WorkoutTrackerDesign');
      expect(repoId.value).toBe('repo_ynk024_workouttrackerdesign');
    });
  });
});
