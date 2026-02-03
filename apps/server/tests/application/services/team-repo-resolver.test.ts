import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TeamRepoResolver } from '../../../src/application/services/team-repo-resolver.js';
import {
  RepoId,
  RepoFullName,
  RepoUrl,
  TeamId,
  TeamSlug,
  ProgrammingLanguage,
} from '../../../src/domain/shared/index.js';
import { Team } from '../../../src/domain/team/team.js';

import type { RepoMetadata } from '../../../src/application/dto/repo-metadata.dto.js';
import type { TeamRepository } from '../../../src/application/ports/team-repository.js';

describe('TeamRepoResolver', () => {
  let teamRepository: TeamRepository;
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
    primaryLanguage: null,
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

    resolver = new TeamRepoResolver(teamRepository);
  });

  describe('resolveFromMetadata', () => {
    it('should return existing team and repo if both exist', async () => {
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
        language: null,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.team).toBe(existingTeam);
      expect(result.repo.id.value).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.repo.fullName.value).toBe('ynk024/Workouttrackerdesign');
      expect(teamRepository.findBySlug).toHaveBeenCalledWith(TeamSlug.create('ynk024'));
      expect(teamRepository.save).not.toHaveBeenCalled();
    });

    it('should create new team if it does not exist', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.team.name).toBe('ynk024');
      expect(result.team.slug.value).toBe('ynk024');
      expect(result.team.id.value).toBe('team_ynk024');
      expect(result.repo.id.value).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.repo.fullName.value).toBe('ynk024/Workouttrackerdesign');
      expect(teamRepository.save).toHaveBeenCalledWith(expect.any(Team));
    });

    it('should create new repo if it does not exist', async () => {
      const teamId = TeamId.create('team_ynk024');
      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.team).toBe(existingTeam);
      expect(result.repo.id.value).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.repo.fullName.value).toBe('ynk024/Workouttrackerdesign');
      expect(result.repo.url.value).toBe('https://github.com/ynk024/Workouttrackerdesign');
      expect(result.repo.defaultBranch).toBe('main');
      expect(result.repo.teamId.equals(teamId)).toBe(true);
      expect(teamRepository.save).toHaveBeenCalledWith(expect.any(Team));
    });

    it('should create both team and repo if neither exist', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.team.name).toBe('ynk024');
      expect(result.team.slug.value).toBe('ynk024');
      expect(result.team.id.value).toBe('team_ynk024');
      expect(result.repo.id.value).toBe('repo_ynk024_workouttrackerdesign');
      expect(result.repo.fullName.value).toBe('ynk024/Workouttrackerdesign');
      expect(teamRepository.save).toHaveBeenCalledWith(expect.any(Team));
    });

    it('should link repo to team when creating new repo', async () => {
      const teamId = TeamId.create('team_ynk024');
      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.team.hasRepo(result.repo.id)).toBe(true);
      expect(result.team.getRepoCount()).toBe(1);
      expect(teamRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should not duplicate repo in team if repo already linked', async () => {
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
        language: null,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.team.getRepoCount()).toBe(1);
      expect(teamRepository.save).not.toHaveBeenCalled();
    });

    it('should normalize owner to lowercase for slug', async () => {
      const metadataWithUpperCase: RepoMetadata = {
        ...sampleMetadata,
        owner: 'YNK024',
        fullName: 'YNK024/Workouttrackerdesign',
      };

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(metadataWithUpperCase);

      expect(result.team.slug.value).toBe('ynk024');
      expect(result.team.id.value).toBe('team_ynk024');
    });

    it('should use github as default provider', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.repo.provider).toBe('github');
    });

    it('should use refName as default branch', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.repo.defaultBranch).toBe('main');
    });

    it('should handle refs/heads/ prefix in branch name', async () => {
      const metadataWithRef: RepoMetadata = {
        ...sampleMetadata,
        refName: 'refs/heads/feature-branch',
      };

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(metadataWithRef);

      expect(result.repo.defaultBranch).toBe('feature-branch');
    });

    it('should create new repo with language from metadata', async () => {
      const metadataWithLanguage: RepoMetadata = {
        ...sampleMetadata,
        primaryLanguage: 'javascript',
      };

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(metadataWithLanguage);

      expect(result.repo.language).not.toBeNull();
      expect(result.repo.language?.value).toBe('javascript');
    });

    it('should create new repo with null language when metadata has no language', async () => {
      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.repo.language).toBeNull();
    });

    it('should update existing repo language when it changes', async () => {
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
        language: null,
      });

      const metadataWithNewLanguage: RepoMetadata = {
        ...sampleMetadata,
        primaryLanguage: 'typescript',
      };

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(metadataWithNewLanguage);

      expect(result.repo.language).not.toBeNull();
      expect(result.repo.language?.value).toBe('typescript');
      expect(teamRepository.save).toHaveBeenCalledWith(expect.any(Team));
    });

    it('should not save team when language has not changed', async () => {
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
        language: null,
      });

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);

      const result = await resolver.resolveFromMetadata(sampleMetadata);

      expect(result.repo.language).toBeNull();
      expect(teamRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for unsupported language', async () => {
      const metadataWithUnsupportedLanguage: RepoMetadata = {
        ...sampleMetadata,
        primaryLanguage: 'python',
      };

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      await expect(resolver.resolveFromMetadata(metadataWithUnsupportedLanguage)).rejects.toThrow(
        'Invalid programming language: python. Supported languages: javascript, typescript, java',
      );
    });

    it('should update language from null to javascript', async () => {
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
        language: null,
      });

      const metadataWithLanguage: RepoMetadata = {
        ...sampleMetadata,
        primaryLanguage: 'javascript',
      };

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(metadataWithLanguage);

      expect(result.repo.language).not.toBeNull();
      expect(result.repo.language?.value).toBe('javascript');
      expect(teamRepository.save).toHaveBeenCalledWith(expect.any(Team));
    });

    it('should update language from javascript to typescript', async () => {
      const teamId = TeamId.create('team_ynk024');
      const repoId = RepoId.create('repo_ynk024_workouttrackerdesign');

      const existingTeam = Team.create({
        id: teamId,
        name: 'ynk024',
        slug: TeamSlug.create('ynk024'),
      });

      const jsLanguage = ProgrammingLanguage.create('javascript');

      existingTeam.addRepo({
        id: repoId,
        provider: 'github',
        fullName: RepoFullName.create('ynk024/Workouttrackerdesign'),
        url: RepoUrl.create('https://github.com/ynk024/Workouttrackerdesign'),
        defaultBranch: 'main',
        teamId,
        archived: false,
        language: jsLanguage,
      });

      const metadataWithNewLanguage: RepoMetadata = {
        ...sampleMetadata,
        primaryLanguage: 'typescript',
      };

      vi.mocked(teamRepository.findBySlug).mockResolvedValue(existingTeam);
      vi.mocked(teamRepository.save).mockImplementation(async (team) => team);

      const result = await resolver.resolveFromMetadata(metadataWithNewLanguage);

      expect(result.repo.language).not.toBeNull();
      expect(result.repo.language?.value).toBe('typescript');
      expect(teamRepository.save).toHaveBeenCalledWith(expect.any(Team));
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
