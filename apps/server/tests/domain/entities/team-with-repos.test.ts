import { describe, it, expect } from 'vitest';

import { RepoId, RepoFullName, RepoUrl } from '../../../src/domain/shared/repo-types.js';
import { TeamId, TeamSlug } from '../../../src/domain/shared/team-types.js';
import { Team, RepoEntity } from '../../../src/domain/team/team.js';
import {
  ValidationError,
  BusinessRuleViolationError,
} from '../../../src/shared/errors/domain-errors.js';

describe('Team (with Embedded Repos)', () => {
  describe('creation', () => {
    it('should create a team with empty repos array', () => {
      const props = {
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      };

      const team = Team.create(props);

      expect(team.id.value).toBe('team_test');
      expect(team.name).toBe('Test Team');
      expect(team.slug.value).toBe('test-team');
      expect(team.repos).toEqual([]);
      expect(team.getRepoCount()).toBe(0);
    });

    it('should throw ValidationError when name is empty', () => {
      const props = {
        id: TeamId.create('team_test'),
        name: '',
        slug: TeamSlug.create('test-team'),
        repos: [],
      };

      expect(() => Team.create(props)).toThrow(ValidationError);
      expect(() => Team.create(props)).toThrow('Team name cannot be empty');
    });

    it('should throw ValidationError when name is only whitespace', () => {
      const props = {
        id: TeamId.create('team_test'),
        name: '   ',
        slug: TeamSlug.create('test-team'),
        repos: [],
      };

      expect(() => Team.create(props)).toThrow(ValidationError);
      expect(() => Team.create(props)).toThrow('Team name cannot be empty');
    });

    it('should trim name on creation', () => {
      const props = {
        id: TeamId.create('team_test'),
        name: '  Test Team  ',
        slug: TeamSlug.create('test-team'),
        repos: [],
      };

      const team = Team.create(props);
      expect(team.name).toBe('Test Team');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a team with repos', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const repoEntity = RepoEntity.create({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo1'),
        url: RepoUrl.create('https://github.com/test-org/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      const props = {
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [repoEntity],
        createdAt,
        updatedAt,
      };

      const team = Team.reconstitute(props);

      expect(team.id.value).toBe('team_test');
      expect(team.name).toBe('Test Team');
      expect(team.getRepoCount()).toBe(1);
      expect(team.getRepo(RepoId.create('repo_1'))?.fullName.value).toBe('test-org/repo1');
    });
  });

  describe('addRepo', () => {
    it('should add a repo to the team', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      expect(team.getRepoCount()).toBe(0);

      const repo = team.addRepo({
        id: RepoId.create('repo_new'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/new-repo'),
        url: RepoUrl.create('https://github.com/test-org/new-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      expect(team.getRepoCount()).toBe(1);
      expect(team.getRepo(RepoId.create('repo_new'))?.fullName.value).toBe('test-org/new-repo');
      expect(repo.fullName.value).toBe('test-org/new-repo');
    });

    it('should throw BusinessRuleViolationError when adding duplicate repo', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo1'),
        url: RepoUrl.create('https://github.com/test-org/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      expect(() =>
        team.addRepo({
          id: RepoId.create('repo_1'),
          provider: 'github',
          fullName: RepoFullName.create('test-org/repo1'),
          url: RepoUrl.create('https://github.com/test-org/repo1'),
          defaultBranch: 'main',
          teamId: TeamId.create('team_test'),
          archived: false,
          language: null,
        }),
      ).toThrow(BusinessRuleViolationError);
      expect(() =>
        team.addRepo({
          id: RepoId.create('repo_1'),
          provider: 'github',
          fullName: RepoFullName.create('test-org/repo1'),
          url: RepoUrl.create('https://github.com/test-org/repo1'),
          defaultBranch: 'main',
          teamId: TeamId.create('team_test'),
          archived: false,
          language: null,
        }),
      ).toThrow('Repo repo_1 is already part of team team_test');
    });

    it('should update updatedAt when adding repo', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      const originalUpdatedAt = team.updatedAt;

      team.addRepo({
        id: RepoId.create('repo_new'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/new-repo'),
        url: RepoUrl.create('https://github.com/test-org/new-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      expect(team.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('removeRepo', () => {
    it('should remove an existing repo', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo1'),
        url: RepoUrl.create('https://github.com/test-org/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      expect(team.getRepoCount()).toBe(1);

      team.removeRepo(RepoId.create('repo_1'));

      expect(team.getRepoCount()).toBe(0);
      expect(team.getRepo(RepoId.create('repo_1'))).toBeUndefined();
    });

    it('should not throw when removing non-existent repo', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      expect(() => {
        team.removeRepo(RepoId.create('non-existent'));
      }).not.toThrow();
      expect(team.getRepoCount()).toBe(0);
    });

    it('should update updatedAt when removing repo', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo1'),
        url: RepoUrl.create('https://github.com/test-org/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      const originalUpdatedAt = team.updatedAt;

      team.removeRepo(RepoId.create('repo_1'));

      expect(team.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('getRepo', () => {
    it('should return repo when exists', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo1'),
        url: RepoUrl.create('https://github.com/test-org/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      const repo = team.getRepo(RepoId.create('repo_1'));

      expect(repo).toBeDefined();
      expect(repo?.fullName.value).toBe('test-org/repo1');
    });

    it('should return undefined when repo not found', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      const repo = team.getRepo(RepoId.create('non-existent'));

      expect(repo).toBeUndefined();
    });
  });

  describe('getRepoByFullName', () => {
    it('should return repo when fullName matches', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo1'),
        url: RepoUrl.create('https://github.com/test-org/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      const repo = team.getRepoByFullName(RepoFullName.create('test-org/repo1'));

      expect(repo).toBeDefined();
      expect(repo?.id.value).toBe('repo_1');
    });

    it('should return undefined when fullName not found', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      const repo = team.getRepoByFullName(RepoFullName.create('test-org/nonexistent'));

      expect(repo).toBeUndefined();
    });
  });

  describe('getActiveRepos', () => {
    it('should return only non-archived repos', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      team.addRepo({
        id: RepoId.create('repo_active'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/active'),
        url: RepoUrl.create('https://github.com/test-org/active'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      team.addRepo({
        id: RepoId.create('repo_archived'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/archived'),
        url: RepoUrl.create('https://github.com/test-org/archived'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: true,
        language: null,
      });

      const activeRepos = team.getActiveRepos();

      expect(activeRepos.length).toBe(1);
      expect(activeRepos[0]?.id.value).toBe('repo_active');
    });
  });

  describe('archiveRepo', () => {
    it('should archive an existing active repo', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo1'),
        url: RepoUrl.create('https://github.com/test-org/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      team.archiveRepo(RepoId.create('repo_1'));

      const repo = team.getRepo(RepoId.create('repo_1'));
      expect(repo?.archived).toBe(true);
    });

    it('should not throw when archiving non-existent repo', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      expect(() => {
        team.archiveRepo(RepoId.create('non-existent'));
      }).not.toThrow();
    });
  });

  describe('hasRepo', () => {
    it('should return true when repo exists', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo1'),
        url: RepoUrl.create('https://github.com/test-org/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      expect(team.hasRepo(RepoId.create('repo_1'))).toBe(true);
    });

    it('should return false when repo does not exist', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      expect(team.hasRepo(RepoId.create('non-existent'))).toBe(false);
    });
  });

  describe('getRepoCount', () => {
    it('should return correct count of repos', () => {
      const team = Team.create({
        id: TeamId.create('team_test'),
        name: 'Test Team',
        slug: TeamSlug.create('test-team'),
        repos: [],
      });

      expect(team.getRepoCount()).toBe(0);

      team.addRepo({
        id: RepoId.create('repo_1'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo1'),
        url: RepoUrl.create('https://github.com/test-org/repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      expect(team.getRepoCount()).toBe(1);

      team.addRepo({
        id: RepoId.create('repo_2'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/repo2'),
        url: RepoUrl.create('https://github.com/test-org/repo2'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      });

      expect(team.getRepoCount()).toBe(2);

      team.removeRepo(RepoId.create('repo_1'));

      expect(team.getRepoCount()).toBe(1);
    });
  });
});
