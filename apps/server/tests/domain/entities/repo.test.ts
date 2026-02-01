import { describe, it, expect } from 'vitest';

import { Repo } from '../../../src/domain/repo/repo.js';
import { RepoId, RepoFullName, RepoUrl, TeamId } from '../../../src/domain/shared/index.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('Repo Entity', () => {
  describe('create', () => {
    it('should create a new repo with valid data', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
      });

      expect(repo.id.value).toBe('repo_test');
      expect(repo.provider).toBe('github');
      expect(repo.fullName.value).toBe('owner/repo');
      expect(repo.url.value).toBe('https://github.com/owner/repo');
      expect(repo.defaultBranch).toBe('main');
      expect(repo.teamId.value).toBe('team_eng');
      expect(repo.archived).toBe(false);
      expect(repo.createdAt).toBeInstanceOf(Date);
      expect(repo.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw ValidationError for empty provider', () => {
      expect(() =>
        Repo.create({
          id: RepoId.create('repo_test'),
          provider: '',
          fullName: RepoFullName.create('owner/repo'),
          url: RepoUrl.create('https://github.com/owner/repo'),
          defaultBranch: 'main',
          teamId: TeamId.create('team_eng'),
          archived: false,
        }),
      ).toThrow(ValidationError);
      expect(() =>
        Repo.create({
          id: RepoId.create('repo_test'),
          provider: '',
          fullName: RepoFullName.create('owner/repo'),
          url: RepoUrl.create('https://github.com/owner/repo'),
          defaultBranch: 'main',
          teamId: TeamId.create('team_eng'),
          archived: false,
        }),
      ).toThrow('Provider cannot be empty');
    });

    it('should throw ValidationError for empty defaultBranch', () => {
      expect(() =>
        Repo.create({
          id: RepoId.create('repo_test'),
          provider: 'github',
          fullName: RepoFullName.create('owner/repo'),
          url: RepoUrl.create('https://github.com/owner/repo'),
          defaultBranch: '',
          teamId: TeamId.create('team_eng'),
          archived: false,
        }),
      ).toThrow(ValidationError);
      expect(() =>
        Repo.create({
          id: RepoId.create('repo_test'),
          provider: 'github',
          fullName: RepoFullName.create('owner/repo'),
          url: RepoUrl.create('https://github.com/owner/repo'),
          defaultBranch: '',
          teamId: TeamId.create('team_eng'),
          archived: false,
        }),
      ).toThrow('Default branch cannot be empty');
    });

    it('should trim provider and defaultBranch', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: '  github  ',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: '  main  ',
        teamId: TeamId.create('team_eng'),
        archived: false,
      });

      expect(repo.provider).toBe('github');
      expect(repo.defaultBranch).toBe('main');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute an existing repo from storage', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-02T00:00:00Z');

      const repo = Repo.reconstitute({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
        createdAt,
        updatedAt,
      });

      expect(repo.id.value).toBe('repo_test');
      expect(repo.createdAt).toEqual(createdAt);
      expect(repo.updatedAt).toEqual(updatedAt);
    });
  });

  describe('archive', () => {
    it('should mark repo as archived', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
      });

      repo.archive();

      expect(repo.archived).toBe(true);
    });

    it('should update updatedAt when archiving', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
      });

      const originalUpdatedAt = repo.updatedAt.getTime();
      repo.archive();

      expect(repo.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });

  describe('unarchive', () => {
    it('should mark repo as not archived', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: true,
      });

      repo.unarchive();

      expect(repo.archived).toBe(false);
    });

    it('should update updatedAt when unarchiving', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: true,
      });

      const originalUpdatedAt = repo.updatedAt.getTime();
      repo.unarchive();

      expect(repo.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });

  describe('updateDefaultBranch', () => {
    it('should update the default branch', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
      });

      repo.updateDefaultBranch('develop');

      expect(repo.defaultBranch).toBe('develop');
    });

    it('should throw ValidationError for empty branch name', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
      });

      expect(() => {
        repo.updateDefaultBranch('');
      }).toThrow(ValidationError);
      expect(() => {
        repo.updateDefaultBranch('');
      }).toThrow('Default branch cannot be empty');
    });

    it('should trim branch name', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
      });

      repo.updateDefaultBranch('  develop  ');

      expect(repo.defaultBranch).toBe('develop');
    });

    it('should update updatedAt when changing branch', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_test'),
        provider: 'github',
        fullName: RepoFullName.create('owner/repo'),
        url: RepoUrl.create('https://github.com/owner/repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
      });

      const originalUpdatedAt = repo.updatedAt.getTime();
      repo.updateDefaultBranch('develop');

      expect(repo.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
    });
  });
});
