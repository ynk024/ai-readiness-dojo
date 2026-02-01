import { Timestamp } from 'firebase-admin/firestore';
import { describe, it, expect } from 'vitest';

import { RepoId, TeamId, TeamSlug } from '../../../../../src/domain/shared/index.js';
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
        repoIds: ['repo_testorg_project1', 'repo_testorg_project2'],
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02T00:00:00.000Z')),
      };

      const team = teamToDomain(firestoreData);

      expect(team).toBeInstanceOf(Team);
      expect(team.id.value).toBe('team_testorg');
      expect(team.name).toBe('Test Organization');
      expect(team.slug.value).toBe('test-organization');
      expect(team.repoIds).toHaveLength(2);
      expect(team.repoIds[0]?.value).toBe('repo_testorg_project1');
      expect(team.repoIds[1]?.value).toBe('repo_testorg_project2');
      expect(team.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(team.updatedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'));
    });

    it('should handle empty repoIds array', () => {
      const firestoreData: TeamFirestoreData = {
        id: 'team_testorg',
        name: 'Test Organization',
        slug: 'test-organization',
        repoIds: [],
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
      };

      const team = teamToDomain(firestoreData);

      expect(team.repoIds).toHaveLength(0);
    });

    it('should convert timestamps to Date objects correctly', () => {
      const createdDate = new Date('2024-06-15T10:30:45.123Z');
      const updatedDate = new Date('2024-06-15T14:20:30.456Z');

      const firestoreData: TeamFirestoreData = {
        id: 'team_testorg',
        name: 'Test Organization',
        slug: 'test-organization',
        repoIds: [],
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
        repoIds: [RepoId.create('repo_testorg_project1'), RepoId.create('repo_testorg_project2')],
      });

      const firestoreData = teamToFirestore(team);

      expect(firestoreData.id).toBe('team_testorg');
      expect(firestoreData.name).toBe('Test Organization');
      expect(firestoreData.slug).toBe('test-organization');
      expect(firestoreData.repoIds).toEqual(['repo_testorg_project1', 'repo_testorg_project2']);
      expect(firestoreData.createdAt).toBeInstanceOf(Date);
      expect(firestoreData.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle empty repoIds array', () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
      });

      const firestoreData = teamToFirestore(team);

      expect(firestoreData.repoIds).toEqual([]);
    });

    it('should preserve Date objects for timestamps', () => {
      const createdDate = new Date('2024-06-15T10:30:45.123Z');
      const updatedDate = new Date('2024-06-15T14:20:30.456Z');

      const team = Team.reconstitute({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
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
        repoIds: [RepoId.create('repo_testorg_project1')],
      });

      const firestoreData = teamToFirestore(team);

      // Ensure we're storing primitives, not value objects
      expect(typeof firestoreData.id).toBe('string');
      expect(typeof firestoreData.slug).toBe('string');
      expect(Array.isArray(firestoreData.repoIds)).toBe(true);
      expect(typeof firestoreData.repoIds[0]).toBe('string');
    });
  });

  describe('teamToDocumentId', () => {
    it('should extract document ID from Team entity', () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
      });

      const docId = teamToDocumentId(team);

      expect(docId).toBe('team_testorg');
    });

    it('should return string type', () => {
      const team = Team.create({
        id: TeamId.create('team_testorg'),
        name: 'Test Organization',
        slug: TeamSlug.create('test-organization'),
        repoIds: [],
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
        repoIds: ['repo_testorg_project1', 'repo_testorg_project2'],
        createdAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02T00:00:00.000Z')),
      };

      // Convert to domain
      const team = teamToDomain(originalFirestoreData);

      // Convert back to Firestore format
      const convertedFirestoreData = teamToFirestore(team);

      // Convert to domain again
      const finalTeam = teamToDomain({
        ...convertedFirestoreData,
        createdAt: Timestamp.fromDate(convertedFirestoreData.createdAt),
        updatedAt: Timestamp.fromDate(convertedFirestoreData.updatedAt),
      });

      // Verify data is preserved
      expect(finalTeam.id.value).toBe(originalFirestoreData.id);
      expect(finalTeam.name).toBe(originalFirestoreData.name);
      expect(finalTeam.slug.value).toBe(originalFirestoreData.slug);
      expect(finalTeam.repoIds.map((id: RepoId) => id.value)).toEqual(
        originalFirestoreData.repoIds,
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
