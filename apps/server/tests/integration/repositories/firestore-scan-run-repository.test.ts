import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ScanRun } from '../../../src/domain/scan-run/scan-run.js';
import {
  CommitSha,
  QuestStatus,
  ScanRunId,
} from '../../../src/domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId } from '../../../src/domain/shared/index.js';
import { FirestoreScanRunRepository } from '../../../src/infrastructure/persistence/firestore/repositories/firestore-scan-run-repository.js';
import {
  clearCollection,
  createTestFirestoreClient,
  documentExists,
  teardownTestFirestore,
  type IsolatedFirestoreClient,
} from '../../helpers/firestore-test-helper.js';

describe('FirestoreScanRunRepository - Integration Tests', () => {
  let repository: FirestoreScanRunRepository;
  let testFirestore: IsolatedFirestoreClient;

  beforeAll(() => {
    testFirestore = createTestFirestoreClient('scan_run_repo_test');
    repository = new FirestoreScanRunRepository(testFirestore);
  });

  afterEach(async () => {
    await clearCollection('scanRuns', testFirestore);
  });

  afterAll(async () => {
    await teardownTestFirestore(testFirestore);
  });

  describe('save() and findById()', () => {
    it('should save and retrieve a scan run', async () => {
      const questResults = new Map<string, QuestStatus>([
        ['docs.agents_md_present', QuestStatus.pass()],
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

      await repository.save(scanRun);

      const found = await repository.findById(ScanRunId.create('scan_run_123'));
      expect(found).not.toBeNull();
      expect(found?.commitSha.value).toBe('7a01375');
      expect(found?.questResults.size).toBe(2);
    });
  });

  describe('findByRepoId()', () => {
    it('should find all scan runs for a repo', async () => {
      const scanRun1 = ScanRun.create({
        id: ScanRunId.create('scan_run_1'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('abc1234'),
        refName: 'refs/heads/main',
        providerRunId: '11111',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/11111',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        questResults: new Map(),
      });

      const scanRun2 = ScanRun.create({
        id: ScanRunId.create('scan_run_2'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('def5678'),
        refName: 'refs/heads/main',
        providerRunId: '22222',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/22222',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-02T00:00:00.000Z'),
        questResults: new Map(),
      });

      await repository.save(scanRun1);
      await repository.save(scanRun2);

      const scans = await repository.findByRepoId(RepoId.create('repo_testorg_myproject'));
      expect(scans).toHaveLength(2);
    });

    it('should order scan runs by scannedAt descending', async () => {
      const scanRun1 = ScanRun.create({
        id: ScanRunId.create('scan_run_1'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('abc1234'),
        refName: 'refs/heads/main',
        providerRunId: '11111',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/11111',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        questResults: new Map(),
      });

      const scanRun2 = ScanRun.create({
        id: ScanRunId.create('scan_run_2'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('def5678'),
        refName: 'refs/heads/main',
        providerRunId: '22222',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/22222',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-02T00:00:00.000Z'),
        questResults: new Map(),
      });

      await repository.save(scanRun1);
      await repository.save(scanRun2);

      const scans = await repository.findByRepoId(RepoId.create('repo_testorg_myproject'));
      expect(scans[0]?.id.value).toBe('scan_run_2'); // Most recent first
      expect(scans[1]?.id.value).toBe('scan_run_1');
    });

    it('should respect limit parameter', async () => {
      const scanRun1 = ScanRun.create({
        id: ScanRunId.create('scan_run_1'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('abc1234'),
        refName: 'refs/heads/main',
        providerRunId: '11111',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/11111',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        questResults: new Map(),
      });

      const scanRun2 = ScanRun.create({
        id: ScanRunId.create('scan_run_2'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('def5678'),
        refName: 'refs/heads/main',
        providerRunId: '22222',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/22222',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-02T00:00:00.000Z'),
        questResults: new Map(),
      });

      await repository.save(scanRun1);
      await repository.save(scanRun2);

      const scans = await repository.findByRepoId(RepoId.create('repo_testorg_myproject'), 1);
      expect(scans).toHaveLength(1);
      expect(scans[0]?.id.value).toBe('scan_run_2');
    });
  });

  describe('findLatestByRepoId()', () => {
    it('should find the latest scan run for a repo', async () => {
      const scanRun1 = ScanRun.create({
        id: ScanRunId.create('scan_run_1'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('abc1234'),
        refName: 'refs/heads/main',
        providerRunId: '11111',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/11111',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        questResults: new Map(),
      });

      const scanRun2 = ScanRun.create({
        id: ScanRunId.create('scan_run_2'),
        teamId: TeamId.create('team_testorg'),
        repoId: RepoId.create('repo_testorg_myproject'),
        commitSha: CommitSha.create('def5678'),
        refName: 'refs/heads/main',
        providerRunId: '22222',
        runUrl: 'https://github.com/testorg/myproject/actions/runs/22222',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-02T00:00:00.000Z'),
        questResults: new Map(),
      });

      await repository.save(scanRun1);
      await repository.save(scanRun2);

      const latest = await repository.findLatestByRepoId(RepoId.create('repo_testorg_myproject'));
      expect(latest).not.toBeNull();
      expect(latest?.id.value).toBe('scan_run_2');
    });

    it('should return null for repo with no scans', async () => {
      const latest = await repository.findLatestByRepoId(RepoId.create('repo_empty'));
      expect(latest).toBeNull();
    });
  });

  describe('delete()', () => {
    it('should delete a scan run', async () => {
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

      await repository.save(scanRun);
      await repository.delete(ScanRunId.create('scan_run_123'));

      const exists = await documentExists('scanRuns', 'scan_run_123', testFirestore);
      expect(exists).toBe(false);
    });
  });
});
