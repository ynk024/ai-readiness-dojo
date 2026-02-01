import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Repo } from '../../../src/domain/entities/repo.js';
import {
  RepoFullName,
  RepoId,
  RepoUrl,
} from '../../../src/domain/value-objects/repo-value-objects.js';
import { TeamId } from '../../../src/domain/value-objects/team-value-objects.js';
import { FirestoreRepoRepository } from '../../../src/infrastructure/persistence/firestore/repositories/firestore-repo-repository.js';
import {
  clearCollection,
  documentExists,
  initializeTestFirestore,
} from '../../helpers/firestore-test-helper.js';

describe('FirestoreRepoRepository - Integration Tests', () => {
  let repository: FirestoreRepoRepository;

  beforeAll(() => {
    const firestoreClient = initializeTestFirestore();
    repository = new FirestoreRepoRepository(firestoreClient);
  });

  afterEach(async () => {
    await clearCollection('repos');
  });

  describe('save() and findById()', () => {
    it('should save and retrieve a repo', async () => {
      const repo = Repo.create({
        id: RepoId.create('repo_testorg_myproject'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/myproject'),
        url: RepoUrl.create('https://github.com/testorg/myproject'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      await repository.save(repo);

      const found = await repository.findById(RepoId.create('repo_testorg_myproject'));
      expect(found).not.toBeNull();
      expect(found?.fullName.value).toBe('testorg/myproject');
    });
  });

  describe('findByFullName()', () => {
    it('should find repo by full name', async () => {
      const repo = Repo.create({
        id: RepoId.create('repo_testorg_myproject'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/myproject'),
        url: RepoUrl.create('https://github.com/testorg/myproject'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      await repository.save(repo);

      const found = await repository.findByFullName(RepoFullName.create('testorg/myproject'));
      expect(found).not.toBeNull();
      expect(found?.id.value).toBe('repo_testorg_myproject');
    });

    it('should return null for non-existent repo', async () => {
      const found = await repository.findByFullName(RepoFullName.create('nonexistent/repo'));
      expect(found).toBeNull();
    });
  });

  describe('findByTeamId()', () => {
    it('should find all repos for a team', async () => {
      const repo1 = Repo.create({
        id: RepoId.create('repo_testorg_project1'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/project1'),
        url: RepoUrl.create('https://github.com/testorg/project1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      const repo2 = Repo.create({
        id: RepoId.create('repo_testorg_project2'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/project2'),
        url: RepoUrl.create('https://github.com/testorg/project2'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      await repository.save(repo1);
      await repository.save(repo2);

      const repos = await repository.findByTeamId(TeamId.create('team_testorg'));
      expect(repos).toHaveLength(2);
    });

    it('should return empty array for team with no repos', async () => {
      const repos = await repository.findByTeamId(TeamId.create('team_empty'));
      expect(repos).toHaveLength(0);
    });
  });

  describe('delete()', () => {
    it('should delete a repo', async () => {
      const repo = Repo.create({
        id: RepoId.create('repo_testorg_myproject'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/myproject'),
        url: RepoUrl.create('https://github.com/testorg/myproject'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      await repository.save(repo);
      await repository.delete(RepoId.create('repo_testorg_myproject'));

      const exists = await documentExists('repos', 'repo_testorg_myproject');
      expect(exists).toBe(false);
    });
  });
});
