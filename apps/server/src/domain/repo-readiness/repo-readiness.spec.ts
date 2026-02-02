import { describe, expect, it } from 'vitest';

import { ScanRunId, ScanResult } from '../scan-run/scan-value-objects.js';
import { RepoId, TeamId } from '../shared/index.js';
import { QuestDefinition, ScanRunSummary } from '../shared/readiness-data.js';

import { RepoReadiness } from './repo-readiness.js';

describe('RepoReadiness', () => {
  const scanRunSummary: ScanRunSummary = {
    id: ScanRunId.create('scan-123'),
    repoId: RepoId.create('repo-123'),
    teamId: TeamId.create('team-123'),
    scannedAt: new Date(),
    questResults: new Map(),
  };

  const questCatalog = new Map<string, QuestDefinition>();

  it('should compute readiness for single level quest (pass)', () => {
    questCatalog.set('quest-1', {
      key: 'quest-1',
      levels: [{ level: 1, condition: { type: 'pass' } }],
    });

    const results = new Map<string, ScanResult>();
    // 'pass' condition checks for passed: true or present: true
    results.set('quest-1', ScanResult.create({ present: true }));

    const summary = { ...scanRunSummary, questResults: results };
    const readiness = RepoReadiness.computeFromScanRun(summary, questCatalog);

    const entry = readiness.getQuestStatus('quest-1');
    expect(entry).toBeDefined();
    expect(entry?.status.isComplete()).toBe(true);
    expect(entry?.level).toBe(1);
  });

  it('should compute readiness for multi-level quest (count metric)', () => {
    questCatalog.set('quest-multi', {
      key: 'quest-multi',
      levels: [
        { level: 1, condition: { type: 'count', min: 1 } },
        { level: 2, condition: { type: 'count', min: 5 } },
        { level: 3, condition: { type: 'count', min: 10 } },
      ],
    });

    const results = new Map<string, ScanResult>();
    // Case 1: Count = 3 -> Should be Level 1
    results.set('quest-multi', ScanResult.create({ count: 3 }));

    let summary = { ...scanRunSummary, questResults: results };
    let readiness = RepoReadiness.computeFromScanRun(summary, questCatalog);

    let entry = readiness.getQuestStatus('quest-multi');
    expect(entry?.level).toBe(1);
    expect(entry?.status.isComplete()).toBe(true);

    // Case 2: Count = 7 -> Should be Level 2
    results.set('quest-multi', ScanResult.create({ count: 7 }));
    summary = { ...scanRunSummary, questResults: results };
    readiness = RepoReadiness.computeFromScanRun(summary, questCatalog);

    entry = readiness.getQuestStatus('quest-multi');
    expect(entry?.level).toBe(2);

    // Case 3: Count = 0 -> Should be Incomplete
    results.set('quest-multi', ScanResult.create({ count: 0 }));
    summary = { ...scanRunSummary, questResults: results };
    readiness = RepoReadiness.computeFromScanRun(summary, questCatalog);

    entry = readiness.getQuestStatus('quest-multi');
    expect(entry?.status.isIncomplete()).toBe(true);
    expect(entry?.level).toBe(1);
  });

  it('should fallback to level 1 for legacy quests (no levels defined)', () => {
    questCatalog.set('quest-legacy', {
      key: 'quest-legacy',
      levels: [],
    });

    const results = new Map<string, ScanResult>();
    // Fallback logic checks for common success indicators
    results.set('quest-legacy', ScanResult.create({ passed: true }));

    const summary = { ...scanRunSummary, questResults: results };
    const readiness = RepoReadiness.computeFromScanRun(summary, questCatalog);

    const entry = readiness.getQuestStatus('quest-legacy');
    expect(entry?.status.isComplete()).toBe(true);
    expect(entry?.level).toBe(1);
  });
});
