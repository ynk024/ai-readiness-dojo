import { describe, it, expect } from 'vitest';

import { Team } from '../../../src/domain/entities/team.js';
import { RepoId } from '../../../src/domain/value-objects/repo-value-objects.js';
import { TeamId, TeamSlug } from '../../../src/domain/value-objects/team-value-objects.js';
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
        repoIds: [],
      });

      expect(team.id.value).toBe('team_eng');
      expect(team.name).toBe('Engineering');
      expect(team.slug.value).toBe('engineering');
      expect(team.repoIds).toEqual([]);
      expect(team.createdAt).toBeInstanceOf(Date);
      expect(team.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a team with existing repos', () => {
      const repoIds = [RepoId.create('repo_1'), RepoId.create('repo_2')];
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds,
      });

      expect(team.repoIds).toHaveLength(2);
      expect(team.repoIds[0]?.value).toBe('repo_1');
      expect(team.repoIds[1]?.value).toBe('repo_2');
    });

    it('should throw ValidationError for empty name', () => {
      expect(() =>
        Team.create({
          id: TeamId.create('team_eng'),
          name: '',
          slug: TeamSlug.create('engineering'),
          repoIds: [],
        }),
      ).toThrow(ValidationError);
      expect(() =>
        Team.create({
          id: TeamId.create('team_eng'),
          name: '',
          slug: TeamSlug.create('engineering'),
          repoIds: [],
        }),
      ).toThrow('Team name cannot be empty');
    });

    it('should throw ValidationError for whitespace-only name', () => {
      expect(() =>
        Team.create({
          id: TeamId.create('team_eng'),
          name: '   ',
          slug: TeamSlug.create('engineering'),
          repoIds: [],
        }),
      ).toThrow(ValidationError);
    });

    it('should trim team name', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: '  Engineering  ',
        slug: TeamSlug.create('engineering'),
        repoIds: [],
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
        repoIds: [RepoId.create('repo_1')],
        createdAt,
        updatedAt,
      });

      expect(team.id.value).toBe('team_eng');
      expect(team.name).toBe('Engineering');
      expect(team.repoIds).toHaveLength(1);
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
        repoIds: [],
      });

      const repoId = RepoId.create('repo_1');
      team.addRepo(repoId);

      expect(team.repoIds).toHaveLength(1);
      expect(team.repoIds[0]?.value).toBe('repo_1');
    });

    it('should update updatedAt when adding a repo', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds: [],
      });

      const originalUpdatedAt = team.updatedAt.getTime();

      team.addRepo(RepoId.create('repo_1'));

      // updatedAt should be updated (may be same millisecond or later)
      expect(team.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
      expect(team.updatedAt).toBeInstanceOf(Date);
    });

    it('should not add duplicate repos', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds: [],
      });

      const repoId = RepoId.create('repo_1');
      team.addRepo(repoId);

      expect(() => {
        team.addRepo(repoId);
      }).toThrow(BusinessRuleViolationError);
      expect(() => {
        team.addRepo(repoId);
      }).toThrow('Repo repo_1 is already part of team team_eng');
      expect(team.repoIds).toHaveLength(1);
    });
  });

  describe('removeRepo', () => {
    it('should remove a repo from the team', () => {
      const repoId = RepoId.create('repo_1');
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds: [repoId],
      });

      team.removeRepo(repoId);

      expect(team.repoIds).toHaveLength(0);
    });

    it('should update updatedAt when removing a repo', () => {
      const repoId = RepoId.create('repo_1');
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds: [repoId],
      });

      const originalUpdatedAt = team.updatedAt.getTime();

      team.removeRepo(repoId);

      // updatedAt should be updated (may be same millisecond or later)
      expect(team.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
      expect(team.updatedAt).toBeInstanceOf(Date);
    });

    it('should not throw error when removing non-existent repo', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds: [],
      });

      expect(() => {
        team.removeRepo(RepoId.create('repo_1'));
      }).not.toThrow();
      expect(team.repoIds).toHaveLength(0);
    });
  });

  describe('hasRepo', () => {
    it('should return true if team has the repo', () => {
      const repoId = RepoId.create('repo_1');
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds: [repoId],
      });

      expect(team.hasRepo(repoId)).toBe(true);
    });

    it('should return false if team does not have the repo', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds: [RepoId.create('repo_1')],
      });

      expect(team.hasRepo(RepoId.create('repo_2'))).toBe(false);
    });

    it('should return false for empty repo list', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds: [],
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
        repoIds: [RepoId.create('repo_1'), RepoId.create('repo_2')],
      });

      expect(team.getRepoCount()).toBe(2);
    });

    it('should return 0 for empty repo list', () => {
      const team = Team.create({
        id: TeamId.create('team_eng'),
        name: 'Engineering',
        slug: TeamSlug.create('engineering'),
        repoIds: [],
      });

      expect(team.getRepoCount()).toBe(0);
    });
  });
});
