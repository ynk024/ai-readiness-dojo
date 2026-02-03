import { describe, it, expect } from 'vitest';

import {
  TeamId,
  TeamSlug,
  RepoId,
  RepoFullName,
  RepoUrl,
} from '../../../src/domain/shared/index.js';
import { Team } from '../../../src/domain/team/team.js';
import {
  ValidationError,
  BusinessRuleViolationError,
} from '../../../src/shared/errors/domain-errors.js';

describe('Team Entity', () => {
  describe('create', () => {
    it('should create a new team with valid data', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      expect(team.id.value).toBe('team_eng');
      expect(team.name).toBe('Engineering');
      expect(team.slug.value).toBe('engineering');
      expect(team.repos).toEqual([]);
      expect(team.createdAt).toBeInstanceOf(Date);
      expect(team.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw ValidationError for empty name', () => {
      expect(() =>
        Team.create({
          id: TeamId.create('team_eng'),
          name: '',
          slug: TeamSlug.create('engineering'),
        }),
      ).toThrow(ValidationError);
      expect(() =>
        Team.create({
          id: TeamId.create('team_eng'),
          name: '',
          slug: TeamSlug.create('engineering'),
        }),
      ).toThrow('Team name cannot be empty');
    });

    it('should throw ValidationError for whitespace-only name', () => {
      expect(() =>
        Team.create({
          id: TeamId.create('team_eng'),
          name: '   ',
          slug: TeamSlug.create('engineering'),
        }),
      ).toThrow(ValidationError);
    });

    it('should trim team name', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: '  Engineering  ',
        slug: TeamSlug.create('engineering'),
      });

      expect(team.name).toBe('Engineering');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute an existing team from storage', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-02T00:00:00Z');

      const team = Team.reconstitute({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repos: [],
        createdAt,
        updatedAt,
      });

      expect(team.id.value).toBe('team_eng');
      expect(team.name).toBe('Engineering');
      expect(team.repos).toHaveLength(0);
      expect(team.createdAt).toEqual(createdAt);
      expect(team.updatedAt).toEqual(updatedAt);
    });
  });

  describe('addRepo', () => {
    it('should add a repo to the team', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      const repo = team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('acme/repo1'),
        url: RepoUrl.create('https://github.com/acme/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
        language: null,
      });

      expect(team.getRepoCount()).toBe(1);
      expect(team.getRepo(RepoId.create('repo_1'))?.fullName.value).toBe('acme/repo1');
      expect(repo.fullName.value).toBe('acme/repo1');
    });

    it('should update updatedAt when adding a repo', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      const originalUpdatedAt = team.updatedAt.getTime();

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('acme/repo1'),
        url: RepoUrl.create('https://github.com/acme/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
        language: null,
      });

      expect(team.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
      expect(team.updatedAt).toBeInstanceOf(Date);
    });

    it('should not add duplicate repos', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('acme/repo1'),
        url: RepoUrl.create('https://github.com/acme/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
        language: null,
      });

      expect(() => {
        team.addRepo({
          id: RepoId.create('repo_1'),
          provider: 'github',
          fullName: RepoFullName.create('acme/repo1'),
          url: RepoUrl.create('https://github.com/acme/repo1'),
          defaultBranch: 'main',
          teamId: TeamId.create('team_eng'),
          archived: false,
          language: null,
        });
      }).toThrow(BusinessRuleViolationError);
      expect(() => {
        team.addRepo({
          id: RepoId.create('repo_1'),
          provider: 'github',
          fullName: RepoFullName.create('acme/repo1'),
          url: RepoUrl.create('https://github.com/acme/repo1'),
          defaultBranch: 'main',
          teamId: TeamId.create('team_eng'),
          archived: false,
          language: null,
        });
      }).toThrow('Repo repo_1 is already part of team team_eng');
      expect(team.getRepoCount()).toBe(1);
    });
  });

  describe('removeRepo', () => {
    it('should remove a repo from the team', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('acme/repo1'),
        url: RepoUrl.create('https://github.com/acme/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
        language: null,
      });

      team.removeRepo(RepoId.create('repo_1'));

      expect(team.getRepoCount()).toBe(0);
    });

    it('should update updatedAt when removing a repo', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('acme/repo1'),
        url: RepoUrl.create('https://github.com/acme/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
        language: null,
      });

      const originalUpdatedAt = team.updatedAt.getTime();

      team.removeRepo(RepoId.create('repo_1'));

      expect(team.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
      expect(team.updatedAt).toBeInstanceOf(Date);
    });

    it('should not throw error when removing non-existent repo', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      expect(() => {
        team.removeRepo(RepoId.create('repo_1'));
      }).not.toThrow();
      expect(team.getRepoCount()).toBe(0);
    });
  });

  describe('hasRepo', () => {
    it('should return true if team has the repo', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('acme/repo1'),
        url: RepoUrl.create('https://github.com/acme/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
        language: null,
      });

      expect(team.hasRepo(RepoId.create('repo_1'))).toBe(true);
    });

    it('should return false if team does not have the repo', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      expect(team.hasRepo(RepoId.create('repo_2'))).toBe(false);
    });

    it('should return false for empty repo list', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      expect(team.hasRepo(RepoId.create('repo_1'))).toBe(false);
    });
  });

  describe('getRepoCount', () => {
    it('should return the number of repos', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('acme/repo1'),
        url: RepoUrl.create('https://github.com/acme/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
        language: null,
      });

      team.addRepo({
        id: RepoId.create('repo_2'),
        provider: 'github',
        fullName: RepoFullName.create('acme/repo2'),
        url: RepoUrl.create('https://github.com/acme/repo2'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_eng'),
        archived: false,
        language: null,
      });

      expect(team.getRepoCount()).toBe(2);
    });

    it('should return 0 for empty repo list', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
      });

      expect(team.getRepoCount()).toBe(0);
    });
  });
});
