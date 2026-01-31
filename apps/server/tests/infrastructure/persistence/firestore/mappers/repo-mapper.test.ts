import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';

import { Repo } from '../../../../../src/domain/entities/repo.js';
import {
  RepoFullName,
  RepoId,
  RepoUrl,
} from '../../../../../src/domain/value-objects/repo-value-objects.js';
import { TeamId } from '../../../../../src/domain/value-objects/team-value-objects.js';
import {
  repoToDocumentId,
  repoToDomain,
  repoToFirestore,
  type RepoFirestoreData,
} from '../../../../../src/infrastructure/persistence/firestore/mappers/repo-mapper.js';

describe('RepoMapper', () => {
  describe('repoToDomain', () => {
    it('should convert Firestore data to domain Repo entity', () => {
      const firestoreData: RepoFirestoreData = {
        id: 'repo_testorg_myproject',
        provider: 'github',
        fullName: 'testorg/myproject',
        url: 'https://github.com/testorg/myproject',
        defaultBranch: 'main',
        teamId: 'team_testorg',
        archived: false,
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02T00:00:00.000Z')),
      };

      const repo = repoToDomain(firestoreData);

      expect(repo).toBeInstanceOf(Repo);
      expect(repo.id.value).toBe('repo_testorg_myproject');
      expect(repo.provider).toBe('github');
      expect(repo.fullName.value).toBe('testorg/myproject');
      expect(repo.url.value).toBe('https://github.com/testorg/myproject');
      expect(repo.defaultBranch).toBe('main');
      expect(repo.teamId.value).toBe('team_testorg');
      expect(repo.archived).toBe(false);
      expect(repo.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(repo.updatedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'));
    });

    it('should handle archived repos', () => {
      const firestoreData: RepoFirestoreData = {
        id: 'repo_testorg_oldproject',
        provider: 'github',
        fullName: 'testorg/oldproject',
        url: 'https://github.com/testorg/oldproject',
        defaultBranch: 'master',
        teamId: 'team_testorg',
        archived: true,
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
      };

      const repo = repoToDomain(firestoreData);

      expect(repo.archived).toBe(true);
    });

    it('should convert timestamps to Date objects correctly', () => {
      const createdDate = new Date('2024-06-15T10:30:45.123Z');
      const updatedDate = new Date('2024-06-15T14:20:30.456Z');

      const firestoreData: RepoFirestoreData = {
        id: 'repo_testorg_myproject',
        provider: 'github',
        fullName: 'testorg/myproject',
        url: 'https://github.com/testorg/myproject',
        defaultBranch: 'main',
        teamId: 'team_testorg',
        archived: false,
        createdAt: Timestamp.fromDate(createdDate),
        updatedAt: Timestamp.fromDate(updatedDate),
      };

      const repo = repoToDomain(firestoreData);

      expect(repo.createdAt.getTime()).toBe(createdDate.getTime());
      expect(repo.updatedAt.getTime()).toBe(updatedDate.getTime());
    });
  });

  describe('repoToFirestore', () => {
    it('should convert domain Repo entity to Firestore data', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_testorg_myproject'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/myproject'),
        url: RepoUrl.create('https://github.com/testorg/myproject'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      const firestoreData = repoToFirestore(repo);

      expect(firestoreData.id).toBe('repo_testorg_myproject');
      expect(firestoreData.provider).toBe('github');
      expect(firestoreData.fullName).toBe('testorg/myproject');
      expect(firestoreData.url).toBe('https://github.com/testorg/myproject');
      expect(firestoreData.defaultBranch).toBe('main');
      expect(firestoreData.teamId).toBe('team_testorg');
      expect(firestoreData.archived).toBe(false);
      expect(firestoreData.createdAt).toBeInstanceOf(Date);
      expect(firestoreData.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle archived repos', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_testorg_oldproject'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/oldproject'),
        url: RepoUrl.create('https://github.com/testorg/oldproject'),
        defaultBranch: 'master',
        teamId: TeamId.create('team_testorg'),
        archived: true,
      });

      const firestoreData = repoToFirestore(repo);

      expect(firestoreData.archived).toBe(true);
    });

    it('should preserve Date objects for timestamps', () => {
      const createdDate = new Date('2024-06-15T10:30:45.123Z');
      const updatedDate = new Date('2024-06-15T14:20:30.456Z');

      const repo = Repo.reconstitute({
        id: RepoId.create('repo_testorg_myproject'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/myproject'),
        url: RepoUrl.create('https://github.com/testorg/myproject'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
        createdAt: createdDate,
        updatedAt: updatedDate,
      });

      const firestoreData = repoToFirestore(repo);

      expect(firestoreData.createdAt).toBe(createdDate);
      expect(firestoreData.updatedAt).toBe(updatedDate);
    });

    it('should extract value objects to primitive values', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_testorg_myproject'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/myproject'),
        url: RepoUrl.create('https://github.com/testorg/myproject'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      const firestoreData = repoToFirestore(repo);

      // Ensure we're storing primitives, not value objects
      expect(typeof firestoreData.id).toBe('string');
      expect(typeof firestoreData.provider).toBe('string');
      expect(typeof firestoreData.fullName).toBe('string');
      expect(typeof firestoreData.url).toBe('string');
      expect(typeof firestoreData.defaultBranch).toBe('string');
      expect(typeof firestoreData.teamId).toBe('string');
      expect(typeof firestoreData.archived).toBe('boolean');
    });
  });

  describe('repoToDocumentId', () => {
    it('should extract document ID from Repo entity', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_testorg_myproject'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/myproject'),
        url: RepoUrl.create('https://github.com/testorg/myproject'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      const docId = repoToDocumentId(repo);

      expect(docId).toBe('repo_testorg_myproject');
    });

    it('should return string type', () => {
      const repo = Repo.create({
        id: RepoId.create('repo_testorg_myproject'),
        provider: 'github',
        fullName: RepoFullName.create('testorg/myproject'),
        url: RepoUrl.create('https://github.com/testorg/myproject'),
        defaultBranch: 'main',
        teamId: TeamId.create('team_testorg'),
        archived: false,
      });

      const docId = repoToDocumentId(repo);

      expect(typeof docId).toBe('string');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve all data through toDomain -> toFirestore -> toDomain', () => {
      const originalFirestoreData: RepoFirestoreData = {
        id: 'repo_testorg_myproject',
        provider: 'github',
        fullName: 'testorg/myproject',
        url: 'https://github.com/testorg/myproject',
        defaultBranch: 'main',
        teamId: 'team_testorg',
        archived: false,
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02T00:00:00.000Z')),
      };

      // Convert to domain
      const repo = repoToDomain(originalFirestoreData);

      // Convert back to Firestore format
      const convertedFirestoreData = repoToFirestore(repo);

      // Convert to domain again
      const finalRepo = repoToDomain({
        ...convertedFirestoreData,
        createdAt: Timestamp.fromDate(convertedFirestoreData.createdAt),
        updatedAt: Timestamp.fromDate(convertedFirestoreData.updatedAt),
      });

      // Verify data is preserved
      expect(finalRepo.id.value).toBe(originalFirestoreData.id);
      expect(finalRepo.provider).toBe(originalFirestoreData.provider);
      expect(finalRepo.fullName.value).toBe(originalFirestoreData.fullName);
      expect(finalRepo.url.value).toBe(originalFirestoreData.url);
      expect(finalRepo.defaultBranch).toBe(originalFirestoreData.defaultBranch);
      expect(finalRepo.teamId.value).toBe(originalFirestoreData.teamId);
      expect(finalRepo.archived).toBe(originalFirestoreData.archived);
      expect(finalRepo.createdAt.getTime()).toBe(
        originalFirestoreData.createdAt.toDate().getTime(),
      );
      expect(finalRepo.updatedAt.getTime()).toBe(
        originalFirestoreData.updatedAt.toDate().getTime(),
      );
    });
  });
});
