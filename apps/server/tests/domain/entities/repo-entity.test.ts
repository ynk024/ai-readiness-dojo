import { describe, it, expect } from 'vitest';

import { RepoId, RepoFullName, RepoUrl } from '../../../src/domain/shared/repo-types.js';
import { TeamId } from '../../../src/domain/shared/team-types.js';
import { RepoEntity } from '../../../src/domain/team/repo-entity.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('RepoEntity (Child Entity)', () => {
  describe('creation', () => {
    it('should create a repo entity with valid props', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      const repo = RepoEntity.create(props);

      expect(repo.id.value).toBe('repo_test_123');
      expect(repo.provider).toBe('github');
      expect(repo.fullName.value).toBe('test-org/test-repo');
      expect(repo.url.value).toBe('https://github.com/test-org/test-repo');
      expect(repo.defaultBranch).toBe('main');
      expect(repo.archived).toBe(false);
      expect(repo.teamId.value).toBe('team_test');
    });

    it('should trim provider on creation', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: '  github  ',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      const repo = RepoEntity.create(props);
      expect(repo.provider).toBe('github');
    });

    it('should trim defaultBranch on creation', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: '  main  ',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      const repo = RepoEntity.create(props);
      expect(repo.defaultBranch).toBe('main');
    });

    it('should throw ValidationError when provider is empty', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: '',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      expect(() => RepoEntity.create(props)).toThrow(ValidationError);
      expect(() => RepoEntity.create(props)).toThrow('Provider cannot be empty');
    });

    it('should throw ValidationError when defaultBranch is empty', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: '',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      expect(() => RepoEntity.create(props)).toThrow(ValidationError);
      expect(() => RepoEntity.create(props)).toThrow('Default branch cannot be empty');
    });

    it('should set createdAt and updatedAt on creation', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      const before = new Date();
      const repo = RepoEntity.create(props);
      const after = new Date();

      expect(repo.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(repo.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(repo.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(repo.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a repo entity with all props', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'develop',
        teamId: TeamId.create('team_test'),
        archived: true,
        language: null,
        createdAt,
        updatedAt,
      };

      const repo = RepoEntity.reconstitute(props);

      expect(repo.id.value).toBe('repo_test_123');
      expect(repo.provider).toBe('github');
      expect(repo.fullName.value).toBe('test-org/test-repo');
      expect(repo.defaultBranch).toBe('develop');
      expect(repo.archived).toBe(true);
      expect(repo.createdAt).toBe(createdAt);
      expect(repo.updatedAt).toBe(updatedAt);
    });
  });

  describe('archive', () => {
    it('should archive an active repo', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      const repo = RepoEntity.create(props);
      expect(repo.archived).toBe(false);

      repo.archive();

      expect(repo.archived).toBe(true);
      expect(repo.updatedAt.getTime()).toBeGreaterThanOrEqual(repo.createdAt.getTime());
    });

    it('should update updatedAt when archiving', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      const repo = RepoEntity.create(props);
      const originalUpdatedAt = repo.updatedAt;

      repo.archive();

      expect(repo.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('unarchive', () => {
    it('should unarchive an archived repo', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: true,
        language: null,
      };

      const repo = RepoEntity.create(props);
      expect(repo.archived).toBe(true);

      repo.unarchive();

      expect(repo.archived).toBe(false);
    });
  });

  describe('updateDefaultBranch', () => {
    it('should update default branch with valid input', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      const repo = RepoEntity.create(props);
      expect(repo.defaultBranch).toBe('main');

      repo.updateDefaultBranch('develop');

      expect(repo.defaultBranch).toBe('develop');
    });

    it('should trim default branch on update', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      const repo = RepoEntity.create(props);
      repo.updateDefaultBranch('  feature/new-branch  ');

      expect(repo.defaultBranch).toBe('feature/new-branch');
    });

    it('should throw ValidationError when default branch is empty', () => {
      const props = {
        id: RepoId.create('repo_test_123'),
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo'),
        url: RepoUrl.create('https://github.com/test-org/test-repo'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
      };

      const repo = RepoEntity.create(props);

      expect(() => {
        repo.updateDefaultBranch('');
      }).toThrow(ValidationError);
      expect(() => {
        repo.updateDefaultBranch('');
      }).toThrow('Default branch cannot be empty');
    });
  });

  describe('identity equality', () => {
    it('should compare identity by id only', () => {
      const id1 = RepoId.create('repo_test_123');
      const id2 = RepoId.create('repo_test_456');

      const props1 = {
        id: id1,
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo1'),
        url: RepoUrl.create('https://github.com/test-org/test-repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const props2 = {
        id: id1,
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo2'),
        url: RepoUrl.create('https://github.com/test-org/test-repo2'),
        defaultBranch: 'develop',
        teamId: TeamId.create('team_test'),
        archived: true,
        language: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const props3 = {
        id: id2,
        provider: 'github',
        fullName: RepoFullName.create('test-org/test-repo1'),
        url: RepoUrl.create('https://github.com/test-org/test-repo1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_test'),
        archived: false,
        language: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const repo1 = RepoEntity.reconstitute(props1);
      const repo2 = RepoEntity.reconstitute(props2);
      const repo3 = RepoEntity.reconstitute(props3);

      expect(repo1.equals(repo2)).toBe(true);
      expect(repo1.equals(repo3)).toBe(false);
    });
  });
});
