import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';

import { ScanRun } from '../../../../../src/domain/entities/scan-run.js';
import { RepoId } from '../../../../../src/domain/value-objects/repo-value-objects.js';
import {
  CommitSha,
  QuestStatus,
  ScanRunId,
} from '../../../../../src/domain/value-objects/scan-value-objects.js';
import { TeamId } from '../../../../../src/domain/value-objects/team-value-objects.js';
import {
  scanRunToDocumentId,
  scanRunToDomain,
  scanRunToFirestore,
  type ScanRunFirestoreData,
} from '../../../../../src/infrastructure/persistence/firestore/mappers/scan-run-mapper.js';

describe('ScanRunMapper', () => {
  describe('scanRunToDomain', () => {
    it('should convert Firestore data to domain ScanRun entity', () => {
      const firestoreData: ScanRunFirestoreData = {
        id: 'scan_run_123',
        teamId: 'team_testorg',
        repoId: 'repo_testorg_myproject',
        commitSha: '7a01375',
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        questResults: {
          'docs.agents_md_present': 'pass',
          'quality.prettier_configured': 'pass',
          'quality.eslint_configured': 'fail',
        },
      };

      const scanRun = scanRunToDomain(firestoreData);

      expect(scanRun).toBeInstanceOf(ScanRun);
      expect(scanRun.id.value).toBe('scan_run_123');
      expect(scanRun.teamId.value).toBe('team_testorg');
      expect(scanRun.repoId.value).toBe('repo_testorg_myproject');
      expect(scanRun.commitSha.value).toBe('7a01375');
      expect(scanRun.refName).toBe('refs/heads/main');
      expect(scanRun.providerRunId).toBe('12345678');
      expect(scanRun.runUrl).toBe('https://github.com/testorg/myproject/actions/runs/12345678');
      expect(scanRun.workflowVersion).toBe('1.0.0');
      expect(scanRun.scannedAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(scanRun.questResults.size).toBe(3);
      expect(scanRun.questResults.get('docs.agents_md_present')?.value).toBe('pass');
      expect(scanRun.questResults.get('quality.prettier_configured')?.value).toBe('pass');
      expect(scanRun.questResults.get('quality.eslint_configured')?.value).toBe('fail');
    });

    it('should handle empty quest results', () => {
      const firestoreData: ScanRunFirestoreData = {
        id: 'scan_run_123',
        teamId: 'team_testorg',
        repoId: 'repo_testorg_myproject',
        commitSha: '7a01375',
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        questResults: {},
      };

      const scanRun = scanRunToDomain(firestoreData);

      expect(scanRun.questResults.size).toBe(0);
    });

    it('should convert timestamps to Date objects correctly', () => {
      const scannedDate = new Date('2024-06-15T10:30:45.123Z');

      const firestoreData: ScanRunFirestoreData = {
        id: 'scan_run_123',
        teamId: 'team_testorg',
        repoId: 'repo_testorg_myproject',
        commitSha: '7a01375',
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: Timestamp.fromDate(scannedDate),
        questResults: {},
      };

      const scanRun = scanRunToDomain(firestoreData);

      expect(scanRun.scannedAt.getTime()).toBe(scannedDate.getTime());
    });

    it('should handle all quest status types', () => {
      const firestoreData: ScanRunFirestoreData = {
        id: 'scan_run_123',
        teamId: 'team_testorg',
        repoId: 'repo_testorg_myproject',
        commitSha: '7a01375',
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        questResults: {
          'quest.pass': 'pass',
          'quest.fail': 'fail',
          'quest.unknown': 'unknown',
        },
      };

      const scanRun = scanRunToDomain(firestoreData);

      expect(scanRun.questResults.get('quest.pass')?.isPass()).toBe(true);
      expect(scanRun.questResults.get('quest.fail')?.isFail()).toBe(true);
      expect(scanRun.questResults.get('quest.unknown')?.isUnknown()).toBe(true);
    });
  });

  describe('scanRunToFirestore', () => {
    it('should convert domain ScanRun entity to Firestore data', () => {
      const questResults = new Map<string, QuestStatus>([
        ['docs.agents_md_present', QuestStatus.pass()],
        ['quality.prettier_configured', QuestStatus.pass()],
        ['quality.eslint_configured', QuestStatus.fail()],
      ]);

      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_run_123'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        questResults,
      });

      const firestoreData = scanRunToFirestore(scanRun);

      expect(firestoreData.id).toBe('scan_run_123');
      expect(firestoreData.teamId).toBe('team_testorg');
      expect(firestoreData.repoId).toBe('repo_testorg_myproject');
      expect(firestoreData.commitSha).toBe('7a01375');
      expect(firestoreData.refName).toBe('refs/heads/main');
      expect(firestoreData.providerRunId).toBe('12345678');
      expect(firestoreData.runUrl).toBe(
        'https://github.com/testorg/myproject/actions/runs/12345678',
      );
      expect(firestoreData.workflowVersion).toBe('1.0.0');
      expect(firestoreData.scannedAt).toBeInstanceOf(Date);
      expect(firestoreData.questResults).toEqual({
        'docs.agents_md_present': 'pass',
        'quality.prettier_configured': 'pass',
        'quality.eslint_configured': 'fail',
      });
    });

    it('should handle empty quest results', () => {
      const questResults = new Map<string, QuestStatus>();

      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_run_123'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        questResults,
      });

      const firestoreData = scanRunToFirestore(scanRun);

      expect(firestoreData.questResults).toEqual({});
    });

    it('should preserve Date objects for timestamps', () => {
      const scannedDate = new Date('2024-06-15T10:30:45.123Z');

      const scanRun = ScanRun.reconstitute({
        id: ScanRunId.create('scan_run_123'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: scannedDate,
        questResults: new Map(),
      });

      const firestoreData = scanRunToFirestore(scanRun);

      expect(firestoreData.scannedAt).toBe(scannedDate);
    });

    it('should extract value objects to primitive values', () => {
      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_run_123'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        questResults: new Map([['quest.test', QuestStatus.pass()]]),
      });

      const firestoreData = scanRunToFirestore(scanRun);

      // Ensure we're storing primitives, not value objects
      expect(typeof firestoreData.id).toBe('string');
      expect(typeof firestoreData.teamId).toBe('string');
      expect(typeof firestoreData.repoId).toBe('string');
      expect(typeof firestoreData.commitSha).toBe('string');
      expect(typeof firestoreData.refName).toBe('string');
      expect(typeof firestoreData.providerRunId).toBe('string');
      expect(typeof firestoreData.runUrl).toBe('string');
      expect(typeof firestoreData.workflowVersion).toBe('string');
      expect(typeof firestoreData.questResults).toBe('object');
      expect(typeof firestoreData.questResults['quest.test']).toBe('string');
    });
  });

  describe('scanRunToDocumentId', () => {
    it('should extract document ID from ScanRun entity', () => {
      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_run_123'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        questResults: new Map(),
      });

      const docId = scanRunToDocumentId(scanRun);

      expect(docId).toBe('scan_run_123');
    });

    it('should return string type', () => {
      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_run_123'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        questResults: new Map(),
      });

      const docId = scanRunToDocumentId(scanRun);

      expect(typeof docId).toBe('string');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve all data through toDomain -> toFirestore -> toDomain', () => {
      const originalFirestoreData: ScanRunFirestoreData = {
        id: 'scan_run_123',
        teamId: 'team_testorg',
        repoId: 'repo_testorg_myproject',
        commitSha: '7a01375',
        refName: 'refs/heads/main',
        providerRunId: '12345678',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/12345678',
        workflowVersion: '1.0.0',
        scannedAt: Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z')),
        questResults: {
          'docs.agents_md_present': 'pass',
          'quality.prettier_configured': 'pass',
          'quality.eslint_configured': 'fail',
        },
      };

      // Convert to domain
      const scanRun = scanRunToDomain(originalFirestoreData);

      // Convert back to Firestore format
      const convertedFirestoreData = scanRunToFirestore(scanRun);

      // Convert to domain again
      const finalScanRun = scanRunToDomain({
        ...convertedFirestoreData,
        scannedAt: Timestamp.fromDate(convertedFirestoreData.scannedAt),
      });

      // Verify data is preserved
      expect(finalScanRun.id.value).toBe(originalFirestoreData.id);
      expect(finalScanRun.teamId.value).toBe(originalFirestoreData.teamId);
      expect(finalScanRun.repoId.value).toBe(originalFirestoreData.repoId);
      expect(finalScanRun.commitSha.value).toBe(originalFirestoreData.commitSha);
      expect(finalScanRun.refName).toBe(originalFirestoreData.refName);
      expect(finalScanRun.providerRunId).toBe(originalFirestoreData.providerRunId);
      expect(finalScanRun.runUrl).toBe(originalFirestoreData.runUrl);
      expect(finalScanRun.workflowVersion).toBe(originalFirestoreData.workflowVersion);
      expect(finalScanRun.scannedAt.getTime()).toBe(
        originalFirestoreData.scannedAt.toDate().getTime(),
      );
      expect(finalScanRun.questResults.size).toBe(3);
      expect(finalScanRun.questResults.get('docs.agents_md_present')?.value).toBe('pass');
      expect(finalScanRun.questResults.get('quality.prettier_configured')?.value).toBe('pass');
      expect(finalScanRun.questResults.get('quality.eslint_configured')?.value).toBe('fail');
    });
  });
});
