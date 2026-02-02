import { Timestamp } from 'firebase-admin/firestore';
import { describe, it, expect } from 'vitest';

import {
  ReadinessStatus,
  createQuestReadinessEntry,
} from '../../../../../src/domain/repo-readiness/repo-readiness-value-objects.js';
import { RepoReadiness } from '../../../../../src/domain/repo-readiness/repo-readiness.js';
import { ScanRunId } from '../../../../../src/domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId } from '../../../../../src/domain/shared/index.js';
import {
  repoReadinessToDomain,
  repoReadinessToFirestore,
  repoReadinessToDocumentId,
  type RepoReadinessFirestoreData,
} from '../../../../../src/infrastructure/persistence/firestore/mappers/repo-readiness-mapper.js';

describe('RepoReadinessMapper', () => {
  describe('repoReadinessToDomain', () => {
    it('should convert Firestore data to domain RepoReadiness entity', () => {
      const firestoreData: RepoReadinessFirestoreData = {
        repoId: 'repo_testorg_project1',
        teamId: 'team_testorg',
        computedFromScanRunId: 'scan-123',
        updatedAt: Timestamp.fromDate(new Date('2024-06-15T10:30:00.000Z')),
        quests: {
          'git-basics': {
            status: 'complete',
            level: 1,
            lastSeenAt: Timestamp.fromDate(new Date('2024-06-15T10:25:00.000Z')),
          },
          readme: {
            status: 'incomplete',
            level: 1,
            lastSeenAt: Timestamp.fromDate(new Date('2024-06-15T10:28:00.000Z')),
          },
        },
      };

      const readiness = repoReadinessToDomain(firestoreData);

      expect(readiness).toBeInstanceOf(RepoReadiness);
      expect(readiness.repoId.value).toBe('repo_testorg_project1');
      expect(readiness.teamId.value).toBe('team_testorg');
      expect(readiness.computedFromScanRunId.value).toBe('scan-123');
      expect(readiness.updatedAt).toEqual(new Date('2024-06-15T10:30:00.000Z'));
      expect(readiness.quests.size).toBe(2);
      expect(readiness.quests.get('git-basics')?.status.value).toBe('complete');
      expect(readiness.quests.get('git-basics')?.level).toBe(1);
      expect(readiness.quests.get('readme')?.status.value).toBe('incomplete');
      expect(readiness.quests.get('readme')?.level).toBe(1);
    });

    it('should handle empty quests map', () => {
      const firestoreData: RepoReadinessFirestoreData = {
        repoId: 'repo_testorg_project1',
        teamId: 'team_testorg',
        computedFromScanRunId: 'scan-123',
        updatedAt: Timestamp.fromDate(new Date('2024-06-15T10:30:00.000Z')),
        quests: {},
      };

      const readiness = repoReadinessToDomain(firestoreData);

      expect(readiness.quests.size).toBe(0);
    });

    it('should convert timestamps to Date objects correctly', () => {
      const updatedAt = new Date('2024-06-15T10:30:45.123Z');
      const lastSeenAt = new Date('2024-06-15T10:25:30.456Z');

      const firestoreData: RepoReadinessFirestoreData = {
        repoId: 'repo_testorg_project1',
        teamId: 'team_testorg',
        computedFromScanRunId: 'scan-123',
        updatedAt: Timestamp.fromDate(updatedAt),
        quests: {
          'git-basics': {
            status: 'complete',
            level: 2,
            lastSeenAt: Timestamp.fromDate(lastSeenAt),
          },
        },
      };

      const readiness = repoReadinessToDomain(firestoreData);

      expect(readiness.updatedAt.getTime()).toBe(updatedAt.getTime());
      expect(readiness.quests.get('git-basics')?.lastSeenAt.getTime()).toBe(lastSeenAt.getTime());
    });
  });

  describe('repoReadinessToFirestore', () => {
    it('should convert domain RepoReadiness entity to Firestore data', () => {
      const questsMap = new Map<string, ReturnType<typeof createQuestReadinessEntry>>([
        [
          'git-basics',
          createQuestReadinessEntry(
            ReadinessStatus.complete(),
            1,
            new Date('2024-06-15T10:25:00.000Z'),
          ),
        ],
        [
          'readme',
          createQuestReadinessEntry(
            ReadinessStatus.incomplete(),
            1,
            new Date('2024-06-15T10:28:00.000Z'),
          ),
        ],
      ]);

      const readiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo_testorg_project1'),
        teamId: TeamId.create('team_testorg'),
        computedFromScanRunId: ScanRunId.create('scan-123'),
        updatedAt: new Date('2024-06-15T10:30:00.000Z'),
        quests: questsMap,
      });

      const firestoreData = repoReadinessToFirestore(readiness);

      expect(firestoreData.repoId).toBe('repo_testorg_project1');
      expect(firestoreData.teamId).toBe('team_testorg');
      expect(firestoreData.computedFromScanRunId).toBe('scan-123');
      expect(firestoreData.updatedAt).toEqual(new Date('2024-06-15T10:30:00.000Z'));
      const gitBasicsQuest = firestoreData.quests['git-basics'];
      const readmeQuest = firestoreData.quests['readme'];
      expect(gitBasicsQuest?.status).toBe('complete');
      expect(gitBasicsQuest?.level).toBe(1);
      expect(readmeQuest?.status).toBe('incomplete');
      expect(readmeQuest?.level).toBe(1);
    });

    it('should handle empty quests map', () => {
      const readiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo_testorg_project1'),
        teamId: TeamId.create('team_testorg'),
        computedFromScanRunId: ScanRunId.create('scan-123'),
        updatedAt: new Date('2024-06-15T10:30:00.000Z'),
        quests: new Map(),
      });

      const firestoreData = repoReadinessToFirestore(readiness);

      expect(firestoreData.quests).toEqual({});
    });

    it('should preserve Date objects for timestamps', () => {
      const updatedAt = new Date('2024-06-15T10:30:45.123Z');

      const readiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo_testorg_project1'),
        teamId: TeamId.create('team_testorg'),
        computedFromScanRunId: ScanRunId.create('scan-123'),
        updatedAt,
        quests: new Map(),
      });

      const firestoreData = repoReadinessToFirestore(readiness);

      expect(firestoreData.updatedAt).toBe(updatedAt);
    });

    it('should extract value objects to primitive values', () => {
      const readiness = RepoReadiness.reconstitute({
        repoId: RepoId.create('repo_testorg_project1'),
        teamId: TeamId.create('team_testorg'),
        computedFromScanRunId: ScanRunId.create('scan-123'),
        updatedAt: new Date(),
        quests: new Map([
          ['git-basics', createQuestReadinessEntry(ReadinessStatus.complete(), 3, new Date())],
        ]),
      });

      const firestoreData = repoReadinessToFirestore(readiness);

      expect(typeof firestoreData.repoId).toBe('string');
      expect(typeof firestoreData.teamId).toBe('string');
      expect(typeof firestoreData.computedFromScanRunId).toBe('string');
      const gitBasicsQuest = firestoreData.quests['git-basics'];
      expect(gitBasicsQuest?.status).toBe('complete');
      expect(gitBasicsQuest?.level).toBe(3);
    });
  });

  describe('repoReadinessToDocumentId', () => {
    it('should return "latest" as the document ID', () => {
      const docId = repoReadinessToDocumentId();

      expect(docId).toBe('latest');
    });

    it('should always return string type', () => {
      const docId = repoReadinessToDocumentId();

      expect(typeof docId).toBe('string');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve all data through toDomain -> toFirestore -> toDomain', () => {
      const originalFirestoreData: RepoReadinessFirestoreData = {
        repoId: 'repo_testorg_project1',
        teamId: 'team_testorg',
        computedFromScanRunId: 'scan-123',
        updatedAt: Timestamp.fromDate(new Date('2024-06-15T10:30:00.000Z')),
        quests: {
          'git-basics': {
            status: 'complete',
            level: 2,
            lastSeenAt: Timestamp.fromDate(new Date('2024-06-15T10:25:00.000Z')),
          },
          readme: {
            status: 'incomplete',
            level: 1,
            lastSeenAt: Timestamp.fromDate(new Date('2024-06-15T10:28:00.000Z')),
          },
        },
      };

      const readiness = repoReadinessToDomain(originalFirestoreData);

      const convertedFirestoreData = repoReadinessToFirestore(readiness);

      const finalReadiness = repoReadinessToDomain({
        ...convertedFirestoreData,
        updatedAt: Timestamp.fromDate(convertedFirestoreData.updatedAt),
        quests: Object.fromEntries(
          Object.entries(convertedFirestoreData.quests).map(([key, value]) => [
            key,
            { ...value, lastSeenAt: Timestamp.fromDate(value.lastSeenAt) },
          ]),
        ),
      });

      expect(finalReadiness.repoId.value).toBe(originalFirestoreData.repoId);
      expect(finalReadiness.teamId.value).toBe(originalFirestoreData.teamId);
      expect(finalReadiness.computedFromScanRunId.value).toBe(
        originalFirestoreData.computedFromScanRunId,
      );
      expect(finalReadiness.updatedAt.getTime()).toBe(
        originalFirestoreData.updatedAt.toDate().getTime(),
      );
      expect(Array.from(finalReadiness.quests.keys())).toEqual(
        Object.keys(originalFirestoreData.quests),
      );
      for (const [key, originalEntry] of Object.entries(originalFirestoreData.quests)) {
        const finalEntry = finalReadiness.quests.get(key);
        expect(finalEntry).toBeDefined();
        expect(finalEntry?.status.value).toBe(originalEntry.status);
        expect(finalEntry?.level).toBe(originalEntry.level);
      }
    });
  });
});
