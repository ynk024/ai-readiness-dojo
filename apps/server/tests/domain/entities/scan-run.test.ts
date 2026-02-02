import { describe, it, expect } from 'vitest';

import { ScanRun } from '../../../src/domain/scan-run/scan-run.js';
import {
  ScanRunId,
  CommitSha,
  ScanResult,
} from '../../../src/domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId } from '../../../src/domain/shared/index.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('ScanRun Entity', () => {
  describe('create', () => {
    it('should create a new scan run with valid data', () => {
      const questResults = new Map<string, ScanResult>([
        ['docs.agents_md_present', ScanResult.create({ passed: true })],
        ['quality.coverage_threshold_met', ScanResult.create({ passed: false })],
      ]);

      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_123'),
        teamId: TeamId.create('team_eng'),
        repoId: RepoId.create('repo_test'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'main',
        providerRunId: '12345',
        runUrl: 'https://github.com/owner/repo/actions/runs/12345',
        workflowVersion: '1.0.0',
        scannedAt: new Date('2024-01-01T00:00:00Z'),
        questResults,
      });

      expect(scanRun.id.value).toBe('scan_123');
      expect(scanRun.teamId.value).toBe('team_eng');
      expect(scanRun.repoId.value).toBe('repo_test');
      expect(scanRun.commitSha.value).toBe('7a01375');
      expect(scanRun.refName).toBe('main');
      expect(scanRun.providerRunId).toBe('12345');
      expect(scanRun.runUrl).toBe('https://github.com/owner/repo/actions/runs/12345');
      expect(scanRun.workflowVersion).toBe('1.0.0');
      expect(scanRun.scannedAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(scanRun.questResults.size).toBe(2);
    });

    it('should throw ValidationError for empty refName', () => {
      expect(() =>
        ScanRun.create({
          id: ScanRunId.create('scan_123'),
          teamId: TeamId.create('team_eng'),
          repoId: RepoId.create('repo_test'),
          commitSha: CommitSha.create('7a01375'),
          refName: '',
          providerRunId: '12345',
          runUrl: 'https://github.com/owner/repo/actions/runs/12345',
          workflowVersion: '1.0.0',
          scannedAt: new Date(),
          questResults: new Map(),
        }),
      ).toThrow(ValidationError);
      expect(() =>
        ScanRun.create({
          id: ScanRunId.create('scan_123'),
          teamId: TeamId.create('team_eng'),
          repoId: RepoId.create('repo_test'),
          commitSha: CommitSha.create('7a01375'),
          refName: '',
          providerRunId: '12345',
          runUrl: 'https://github.com/owner/repo/actions/runs/12345',
          workflowVersion: '1.0.0',
          scannedAt: new Date(),
          questResults: new Map(),
        }),
      ).toThrow('Ref name cannot be empty');
    });

    it('should throw ValidationError for empty providerRunId', () => {
      expect(() =>
        ScanRun.create({
          id: ScanRunId.create('scan_123'),
          teamId: TeamId.create('team_eng'),
          repoId: RepoId.create('repo_test'),
          commitSha: CommitSha.create('7a01375'),
          refName: 'main',
          providerRunId: '',
          runUrl: 'https://github.com/owner/repo/actions/runs/12345',
          workflowVersion: '1.0.0',
          scannedAt: new Date(),
          questResults: new Map(),
        }),
      ).toThrow(ValidationError);
      expect(() =>
        ScanRun.create({
          id: ScanRunId.create('scan_123'),
          teamId: TeamId.create('team_eng'),
          repoId: RepoId.create('repo_test'),
          commitSha: CommitSha.create('7a01375'),
          refName: 'main',
          providerRunId: '',
          runUrl: 'https://github.com/owner/repo/actions/runs/12345',
          workflowVersion: '1.0.0',
          scannedAt: new Date(),
          questResults: new Map(),
        }),
      ).toThrow('Provider run ID cannot be empty');
    });

    it('should trim string fields', () => {
      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_123'),
        teamId: TeamId.create('team_eng'),
        repoId: RepoId.create('repo_test'),
        commitSha: CommitSha.create('7a01375'),
        refName: '  main  ',
        providerRunId: '  12345  ',
        runUrl: '  https://github.com/owner/repo/actions/runs/12345  ',
        workflowVersion: '  1.0.0  ',
        scannedAt: new Date(),
        questResults: new Map(),
      });

      expect(scanRun.refName).toBe('main');
      expect(scanRun.providerRunId).toBe('12345');
      expect(scanRun.runUrl).toBe('https://github.com/owner/repo/actions/runs/12345');
      expect(scanRun.workflowVersion).toBe('1.0.0');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute an existing scan run from storage', () => {
      const scannedAt = new Date('2024-01-01T00:00:00Z');
      const questResults = new Map<string, ScanResult>([
        ['docs.agents_md_present', ScanResult.create({ passed: true })],
      ]);

      const scanRun = ScanRun.reconstitute({
        id: ScanRunId.create('scan_123'),
        teamId: TeamId.create('team_eng'),
        repoId: RepoId.create('repo_test'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'main',
        providerRunId: '12345',
        runUrl: 'https://github.com/owner/repo/actions/runs/12345',
        workflowVersion: '1.0.0',
        scannedAt,
        questResults,
      });

      expect(scanRun.id.value).toBe('scan_123');
      expect(scanRun.scannedAt).toEqual(scannedAt);
      expect(scanRun.questResults.size).toBe(1);
    });
  });

  describe('questResults', () => {
    it('should return readonly quest results map', () => {
      const questResults = new Map<string, ScanResult>([
        ['docs.agents_md_present', ScanResult.create({ passed: true })],
      ]);

      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_123'),
        teamId: TeamId.create('team_eng'),
        repoId: RepoId.create('repo_test'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'main',
        providerRunId: '12345',
        runUrl: 'https://github.com/owner/repo/actions/runs/12345',
        workflowVersion: '1.0.0',
        scannedAt: new Date(),
        questResults,
      });

      const results = scanRun.questResults;
      expect(results.get('docs.agents_md_present')?.data.passed).toBe(true);
      expect(results.size).toBe(1);
    });
  });

  describe('getTotalQuests', () => {
    it('should return total number of quests', () => {
      const questResults = new Map<string, ScanResult>([
        ['docs.agents_md_present', ScanResult.create({ passed: true })],
        ['quality.coverage_threshold_met', ScanResult.create({ passed: false })],
        ['sast.codeql_present', ScanResult.create({ passed: true })],
      ]);

      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_123'),
        teamId: TeamId.create('team_eng'),
        repoId: RepoId.create('repo_test'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'main',
        providerRunId: '12345',
        runUrl: 'https://github.com/owner/repo/actions/runs/12345',
        workflowVersion: '1.0.0',
        scannedAt: new Date(),
        questResults,
      });

      expect(scanRun.getTotalQuests()).toBe(3);
    });

    it('should return 0 for empty quest results', () => {
      const scanRun = ScanRun.create({
        id: ScanRunId.create('scan_123'),
        teamId: TeamId.create('team_eng'),
        repoId: RepoId.create('repo_test'),
        commitSha: CommitSha.create('7a01375'),
        refName: 'main',
        providerRunId: '12345',
        runUrl: 'https://github.com/owner/repo/actions/runs/12345',
        workflowVersion: '1.0.0',
        scannedAt: new Date(),
        questResults: new Map(),
      });

      expect(scanRun.getTotalQuests()).toBe(0);
    });
  });
});
