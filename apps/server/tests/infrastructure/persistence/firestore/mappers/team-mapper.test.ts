import { Timestamp } from 'firebase-admin/firestore';
import { describe, it, expect } from 'vitest';

import {
  TeamId,
  TeamSlug,
  RepoId,
  RepoFullName,
  RepoUrl,
} from '../../../../../src/domain/shared/index.js';
import { Team } from '../../../../../src/domain/team/team.js';
import {
  teamToDomain,
  teamToFirestore,
  teamToDocumentId,
  type TeamFirestoreData,
} from '../../../../../src/infrastructure/persistence/firestore/mappers/team-mapper.js';

describe('TeamMapper', () => {
  describe('teamToDomain', () => {
    it('should convert Firestore data to domain Team entity', () => {
      const firestoreData: TeamFirestoreData = {
        id: 'team_testorg',
        name: 'Test Organization',
        slug: 'test-organization',
        repos: [
          {
            id: 'repo_testorg_project1',
            provider: 'github',
            fullName: 'testorg/project1',
            url: 'https://github.com/testorg/project1',
            defaultBranch: 'main',
            teamId: 'team_testorg',
            archived: false,
            createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
            updatedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
          },
          {
            id: 'repo_testorg_project2',
            provider: 'github',
            fullName: 'testorg/project2',
            url: 'https://github.com/testorg/project2',
            defaultBranch: 'main',
            teamId: 'team_testorg',
            archived: false,
            createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
            updatedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
          },
        ],
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02T00:00:00.000Z')),
      };

      const team = teamToDomain(firestoreData);

      expect(team).toBeInstanceOf(Team);
      expect(team.id.value).toBe('team_testorg');
      expect(team.name).toBe('Test Organization');
      expect(team.slug.value).toBe('test-organization');
      expect(team.repos).toHaveLength(2);
      expect(team.repos[0]?.id.value).toBe('repo_testorg_project1');
      expect(team.repos[0]?.fullName.value).toBe('testorg/project1');
      expect(team.repos[1]?.id.value).toBe('repo_testorg_project2');
      expect(team.repos[1]?.fullName.value).toBe('testorg/project2');
      expect(team.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(team.updatedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'));
    });

    it('should handle empty repos array', () => {
      const firestoreData: TeamFirestoreData = {
        id: 'team_testorg',
        name: 'Test Organization',
        slug: 'test-organization',
        repos: [],
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
      };

      const team = teamToDomain(firestoreData);

      expect(team.repos).toHaveLength(0);
    });

    it('should convert timestamps to Date objects correctly', () => {
      const createdDate = new Date('2024-06-15T10:30:45.123Z');
      const updatedDate = new Date('2024-06-15T14:20:30.456Z');

      const firestoreData: TeamFirestoreData = {
        id: 'team_testorg',
        name: 'Test Organization',
        slug: 'test-organization',
        repos: [],
        createdAt: Timestamp.fromDate(createdDate),
        updatedAt: Timestamp.fromDate(updatedDate),
      };

      const team = teamToDomain(firestoreData);

      expect(team.createdAt.getTime()).toBe(createdDate.getTime());
      expect(team.updatedAt.getTime()).toBe(updatedDate.getTime());
    });
  });

  describe('teamToFirestore', () => {
    it('should convert domain Team entity to Firestore data', () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
      });

      team.addRepo({
        id: RepoId.create('repo_testorg_project1'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/project1'),
        url: RepoUrl.create('https://github.com/testorg/project1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      team.addRepo({
        id: RepoId.create('repo_testorg_project2'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/project2'),
        url: RepoUrl.create('https://github.com/testorg/project2'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      const firestoreData = teamToFirestore(team);

      expect(firestoreData.id).toBe('team_testorg');
      expect(firestoreData.name).toBe('Test Organization');
      expect(firestoreData.slug).toBe('test-organization');
      expect(firestoreData.repos).toHaveLength(2);
      expect(firestoreData.repos[0]?.id).toBe('repo_testorg_project1');
      expect(firestoreData.repos[0]?.fullName).toBe('testorg/project1');
      expect(firestoreData.repos[1]?.id).toBe('repo_testorg_project2');
      expect(firestoreData.repos[1]?.fullName).toBe('testorg/project2');
      expect(firestoreData.createdAt).toBeInstanceOf(Date);
      expect(firestoreData.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle empty repos array', () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
      });

      const firestoreData = teamToFirestore(team);

      expect(firestoreData.repos).toEqual([]);
    });

    it('should preserve Date objects for timestamps', () => {
      const createdDate = new Date('2024-06-15T10:30:45.123Z');
      const updatedDate = new Date('2024-06-15T14:20:30.456Z');

      const team = Team.reconstitute({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repos: [],
        createdAt: createdDate,
        updatedAt: updatedDate,
      });

      const firestoreData = teamToFirestore(team);

      expect(firestoreData.createdAt).toBe(createdDate);
      expect(firestoreData.updatedAt).toBe(updatedDate);
    });

    it('should extract value objects to primitive values', () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
      });

      team.addRepo({
        id: RepoId.create('repo_testorg_project1'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/project1'),
        url: RepoUrl.create('https://github.com/testorg/project1'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      const firestoreData = teamToFirestore(team);

      expect(typeof firestoreData.id).toBe('string');
      expect(typeof firestoreData.slug).toBe('string');
      expect(Array.isArray(firestoreData.repos)).toBe(true);
      expect(firestoreData.repos[0]?.id).toBe('repo_testorg_project1');
      expect(firestoreData.repos[0]?.fullName).toBe('testorg/project1');
    });
  });

  describe('teamToDocumentId', () => {
    it('should extract document ID from Team entity', () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
      });

      const docId = teamToDocumentId(team);

      expect(docId).toBe('team_testorg');
    });

    it('should return string type', () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
      });

      const docId = teamToDocumentId(team);

      expect(typeof docId).toBe('string');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve all data through toDomain -> toFirestore -> toDomain', () => {
      const originalFirestoreData: TeamFirestoreData = {
        id: 'team_testorg',
        name: 'Test Organization',
        slug: 'test-organization',
        repos: [
          {
            id: 'repo_testorg_project1',
            provider: 'github',
            fullName: 'testorg/project1',
            url: 'https://github.com/testorg/project1',
            defaultBranch: 'main',
            teamId: 'team_testorg',
            archived: false,
            createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
            updatedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
          },
          {
            id: 'repo_testorg_project2',
            provider: 'github',
            fullName: 'testorg/project2',
            url: 'https://github.com/testorg/project2',
            defaultBranch: 'main',
            teamId: 'team_testorg',
            archived: false,
            createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
            updatedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
          },
        ],
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02T00:00:00.000Z')),
      };

      const team = teamToDomain(originalFirestoreData);

      const convertedFirestoreData = teamToFirestore(team);

      const finalTeam = teamToDomain({
        ...convertedFirestoreData,
        createdAt: Timestamp.fromDate(convertedFirestoreData.createdAt),
        updatedAt: Timestamp.fromDate(convertedFirestoreData.updatedAt),
      });

      expect(finalTeam.id.value).toBe(originalFirestoreData.id);
      expect(finalTeam.name).toBe(originalFirestoreData.name);
      expect(finalTeam.slug.value).toBe(originalFirestoreData.slug);
      expect(finalTeam.repos.map((repo) => repo.id.value)).toEqual(
        originalFirestoreData.repos.map((r) => r.id),
      );
      expect(finalTeam.repos.map((repo) => repo.fullName.value)).toEqual(
        originalFirestoreData.repos.map((r) => r.fullName),
      );
      expect(finalTeam.createdAt.getTime()).toBe(
        originalFirestoreData.createdAt.toDate().getTime(),
      );
      expect(finalTeam.updatedAt.getTime()).toBe(
        originalFirestoreData.updatedAt.toDate().getTime(),
      );
    });
  });
});
