import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { RepoId, TeamId, TeamSlug } from '../../../src/domain/shared/index.js';
import { Team } from '../../../src/domain/team/team.js';
import { FirestoreTeamRepository } from '../../../src/infrastructure/persistence/firestore/repositories/firestore-team-repository.js';
import {
  clearCollection,
  createTestFirestoreClient,
  documentExists,
  getCollectionCount,
  teardownTestFirestore,
  type IsolatedFirestoreClient,
} from '../../helpers/firestore-test-helper.js';

/**
 * Firestore Team Repository Integration Tests
 *
 * These tests verify the Firestore repository implementation using the emulator.
 * Prerequisites:
 * - Firestore emulator must be running on localhost:8080
 * - Run: pnpm emulator:start (in another terminal)
 */

describe('FirestoreTeamRepository - Integration Tests', () => {
  let repository: FirestoreTeamRepository;
  let testFirestore: IsolatedFirestoreClient;

  beforeAll(() => {
    testFirestore = createTestFirestoreClient('team_repo_test');
    repository = new FirestoreTeamRepository(testFirestore);
  });

  afterEach(async () => {
    // Clear test data between tests in the same file
    await clearCollection('teams', testFirestore);
  });

  afterAll(async () => {
    await teardownTestFirestore(testFirestore);
  });

  describe('save() - Create Team', () => {
    it('should save a new team to Firestore', async () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
      });

      const savedTeam = await repository.save(team);

      expect(savedTeam.id.value).toBe('team_testorg');
      expect(savedTeam.name).toBe('Test Organization');
      expect(savedTeam.slug.value).toBe('test-organization');
      expect(savedTeam.repoIds).toHaveLength(0);

      const exists = await documentExists('teams', 'team_testorg', testFirestore);
      expect(exists).toBe(true);
    });

    it('should save a team with repos', async () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [RepoId.create('repo_testorg_project1'), RepoId.create('repo_testorg_project2')],
      });

      const savedTeam = await repository.save(team);

      expect(savedTeam.repoIds).toHaveLength(2);
      expect(savedTeam.repoIds[0]?.value).toBe('repo_testorg_project1');
      expect(savedTeam.repoIds[1]?.value).toBe('repo_testorg_project2');
    });

    it('should update an existing team when saved again', async () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
      });

      await repository.save(team);

      // Add a repo and save again
      team.addRepo(RepoId.create('repo_testorg_newproject'));
      const updatedTeam = await repository.save(team);

      expect(updatedTeam.repoIds).toHaveLength(1);

      // Should still be only one document
      const count = await getCollectionCount('teams', testFirestore);
      expect(count).toBe(1);
    });
  });

  describe('findById() - Read Single Team', () => {
    it('should retrieve a team by ID', async () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
      });
      await repository.save(team);

      const foundTeam = await repository.findById(TeamId.create('team_testorg'));

      expect(foundTeam).not.toBeNull();
      expect(foundTeam?.id.value).toBe('team_testorg');
      expect(foundTeam?.name).toBe('Test Organization');
    });

    it('should return null for non-existent team', async () => {
      const foundTeam = await repository.findById(TeamId.create('team_nonexistent'));

      expect(foundTeam).toBeNull();
    });

    it('should preserve all team properties', async () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [RepoId.create('repo_testorg_project1')],
      });
      await repository.save(team);

      const foundTeam = await repository.findById(TeamId.create('team_testorg'));

      expect(foundTeam).not.toBeNull();
      expect(foundTeam?.slug.value).toBe('test-organization');
      expect(foundTeam?.repoIds).toHaveLength(1);
      expect(foundTeam?.repoIds[0]?.value).toBe('repo_testorg_project1');
      expect(foundTeam?.createdAt).toBeInstanceOf(Date);
      expect(foundTeam?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findBySlug() - Find Team by Slug', () => {
    it('should retrieve a team by slug', async () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
      });
      await repository.save(team);

      const foundTeam = await repository.findBySlug(TeamSlug.create('test-organization'));

      expect(foundTeam).not.toBeNull();
      expect(foundTeam?.id.value).toBe('team_testorg');
      expect(foundTeam?.slug.value).toBe('test-organization');
    });

    it('should return null for non-existent slug', async () => {
      const foundTeam = await repository.findBySlug(TeamSlug.create('nonexistent-slug'));

      expect(foundTeam).toBeNull();
    });

    it('should handle multiple teams with different slugs', async () => {
      const team1 = Team.create({
        id: TeamId.create('team_org1'),
        name: 'Organization 1',
        slug: TeamSlug.create('organization-1'),
        repoIds: [],
      });
      const team2 = Team.create({
        id: TeamId.create('team_org2'),
        name: 'Organization 2',
        slug: TeamSlug.create('organization-2'),
        repoIds: [],
      });

      await repository.save(team1);
      await repository.save(team2);

      const foundTeam1 = await repository.findBySlug(TeamSlug.create('organization-1'));
      const foundTeam2 = await repository.findBySlug(TeamSlug.create('organization-2'));

      expect(foundTeam1?.id.value).toBe('team_org1');
      expect(foundTeam2?.id.value).toBe('team_org2');
    });
  });

  describe('findAll() - Read All Teams', () => {
    it('should return empty array when no teams exist', async () => {
      const teams = await repository.findAll();

      expect(teams).toHaveLength(0);
    });

    it('should retrieve all teams', async () => {
      const team1 = Team.create({
        id: TeamId.create('team_org1'),
        name: 'Organization 1',
        slug: TeamSlug.create('organization-1'),
        repoIds: [],
      });
      const team2 = Team.create({
        id: TeamId.create('team_org2'),
        name: 'Organization 2',
        slug: TeamSlug.create('organization-2'),
        repoIds: [],
      });

      await repository.save(team1);
      await repository.save(team2);

      const teams = await repository.findAll();

      expect(teams).toHaveLength(2);
      const teamIds = teams.map((t: Team) => t.id.value);
      expect(teamIds).toContain('team_org1');
      expect(teamIds).toContain('team_org2');
    });
  });

  describe('delete() - Delete Team', () => {
    it('should delete an existing team', async () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
      });
      await repository.save(team);

      await repository.delete(TeamId.create('team_testorg'));

      const exists = await documentExists('teams', 'team_testorg', testFirestore);
      expect(exists).toBe(false);

      const foundTeam = await repository.findById(TeamId.create('team_testorg'));
      expect(foundTeam).toBeNull();
    });

    it('should throw error when deleting non-existent team', async () => {
      await expect(repository.delete(TeamId.create('team_nonexistent'))).rejects.toThrow();
    });
  });

  describe('exists() - Check Existence', () => {
    it('should return true for existing team', async () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
      });
      await repository.save(team);

      const exists = await repository.exists(TeamId.create('team_testorg'));

      expect(exists).toBe(true);
    });

    it('should return false for non-existent team', async () => {
      const exists = await repository.exists(TeamId.create('team_nonexistent'));

      expect(exists).toBe(false);
    });
  });
});
