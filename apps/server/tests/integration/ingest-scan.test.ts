import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildServer } from '../../src/index.js';
import {
  createTestFirestoreClient,
  teardownTestFirestore,
  type IsolatedFirestoreClient,
} from '../helpers/firestore-test-helper.js';

import type { FastifyInstance } from 'fastify';

interface IngestScanResponseDto {
  scanRunId: string;
  teamId: string;
  repoId: string;
  summary: {
    totalQuests: number;
    passedQuests: number;
    failedQuests: number;
  };
}

describe('POST /api/ingest-scan - Integration Test', () => {
  let server: FastifyInstance;
  let testFirestore: IsolatedFirestoreClient;

  // Sample AI-Readiness Report payload
  const sampleReport = {
    metadata: {
      repository: {
        name: 'ynk024/Workouttrackerdesign',
        url: 'https://github.com/ynk024/Workouttrackerdesign',
        commit_sha: '7a0137597745d539fd41e88b85779eccf118afcc',
        branch: 'main',
        run_id: '21545800679',
        run_url: 'https://github.com/ynk024/Workouttrackerdesign/actions/runs/21545800679',
      },
      timestamp: '2026-01-31T17:39:21.414Z',
      workflow_version: '1.0.0',
    },
    checks: {
      documentation: {
        agents_md: { present: true },
        skill_md: { count: 1 },
      },
      formatters: {
        javascript: { prettier: { present: true } },
      },
      linting: {
        javascript: { eslint: { present: true } },
      },
      sast: {
        codeql: { present: true },
        semgrep: { present: false },
      },
      test_coverage: {
        available: true,
        meets_threshold: false,
      },
    },
  };

  async function seedQuests() {
    // Clear quests first to ensure clean state
    const collection = testFirestore.collection('quests');
    const snapshot = await collection.get();
    if (!snapshot.empty) {
      const batch = testFirestore.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // Seed quests so readiness computation works
    const quests = [
      { key: 'docs.agents_md_present', levels: [{ level: 1, condition: { type: 'pass' } }] },
      { key: 'docs.skill_md_count', levels: [{ level: 1, condition: { type: 'count', min: 1 } }] },
      {
        key: 'formatters.javascript.prettier_present',
        levels: [{ level: 1, condition: { type: 'pass' } }],
      },
      {
        key: 'linting.javascript.eslint_present',
        levels: [{ level: 1, condition: { type: 'pass' } }],
      },
      { key: 'sast.codeql_present', levels: [{ level: 1, condition: { type: 'pass' } }] },
      { key: 'sast.semgrep_present', levels: [{ level: 1, condition: { type: 'pass' } }] },
      { key: 'quality.coverage_available', levels: [{ level: 1, condition: { type: 'pass' } }] },
      {
        key: 'quality.coverage_threshold_met',
        levels: [{ level: 1, condition: { type: 'pass' } }],
      },
    ];

    const batch = testFirestore.batch();
    for (const q of quests) {
      const ref = testFirestore.document('quests', q.key);
      const data = {
        ...q,
        id: q.key,
        title: `Quest ${q.key}`,
        description: 'Test Quest Description',
        active: true,
        category: 'general',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      batch.set(ref, data);
    }
    await batch.commit();
  }

  beforeAll(async () => {
    // Initialize isolated Firestore test client
    testFirestore = createTestFirestoreClient('ingest_scan_test');

    // Seed quests
    await seedQuests();

    // Build server with test Firestore client
    server = await buildServer(testFirestore);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    // Clean up all test data
    await teardownTestFirestore(testFirestore);
  });

  it('should return 200 and ingest scan run successfully', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: sampleReport,
    });

    expect(response.statusCode).toBe(200);
  });

  it('should return correct response structure with IDs and summary', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: sampleReport,
    });

    const body = JSON.parse(response.body) as IngestScanResponseDto;

    expect(body).toMatchObject({
      scanRunId: expect.stringMatching(/^scanrun_/),
      teamId: 'team_ynk024',
      repoId: 'repo_ynk024_workouttrackerdesign',
      summary: {
        totalQuests: 8,
        passedQuests: 6,
        failedQuests: 2,
      },
    });
  });

  it('should persist team data to Firestore', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: sampleReport,
    });

    expect(response.statusCode).toBe(200);

    // Verify team was created in Firestore
    const firestoreClient = server.firestoreClient;
    const teamDoc = await firestoreClient.document('teams', 'team_ynk024').get();

    expect(teamDoc.exists).toBe(true);
    const teamData = teamDoc.data();
    expect(teamData).toMatchObject({
      id: 'team_ynk024',
      name: 'ynk024',
      slug: 'ynk024',
    });
    expect(teamData?.repos).toBeDefined();
    expect(Array.isArray(teamData?.repos)).toBe(true);
    const repo = teamData?.repos.find(
      (r: { id: string }) => r.id === 'repo_ynk024_workouttrackerdesign',
    );
    expect(repo).toBeDefined();
    expect(repo.fullName).toBe('ynk024/Workouttrackerdesign');
  });

  it('should persist repo data to Firestore (embedded in team)', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: sampleReport,
    });

    expect(response.statusCode).toBe(200);

    const firestoreClient = server.firestoreClient;
    const teamDoc = await firestoreClient.document('teams', 'team_ynk024').get();

    expect(teamDoc.exists).toBe(true);
    const teamData = teamDoc.data();
    expect(teamData?.repos).toBeDefined();
    const repo = teamData?.repos.find(
      (r: { id: string }) => r.id === 'repo_ynk024_workouttrackerdesign',
    );
    expect(repo).toBeDefined();
    expect(repo.fullName).toBe('ynk024/Workouttrackerdesign');
    expect(repo.provider).toBe('github');
    expect(repo.url).toBe('https://github.com/ynk024/Workouttrackerdesign');
    expect(repo.defaultBranch).toBe('main');
    expect(repo.teamId).toBe('team_ynk024');
    expect(repo.archived).toBe(false);
  });

  it('should persist scan run data to Firestore', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: sampleReport,
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as IngestScanResponseDto;
    const scanRunId = body.scanRunId;

    // Verify scan run was created in Firestore
    const firestoreClient = server.firestoreClient;
    const scanRunDoc = await firestoreClient.document('scanRuns', scanRunId).get();

    expect(scanRunDoc.exists).toBe(true);
    const scanRunData = scanRunDoc.data();
    expect(scanRunData).toMatchObject({
      id: scanRunId,
      teamId: 'team_ynk024',
      repoId: 'repo_ynk024_workouttrackerdesign',
      commitSha: '7a0137597745d539fd41e88b85779eccf118afcc',
      refName: 'main',
      providerRunId: '21545800679',
      runUrl: 'https://github.com/ynk024/Workouttrackerdesign/actions/runs/21545800679',
      workflowVersion: '1.0.0',
    });

    // Verify scannedAt timestamp (Firestore returns Timestamp object)
    expect(scanRunData?.scannedAt).toBeDefined();
    const scannedAtTimestamp = scanRunData?.scannedAt;
    if (scannedAtTimestamp && typeof scannedAtTimestamp.toDate === 'function') {
      expect(scannedAtTimestamp.toDate().toISOString()).toBe('2026-01-31T17:39:21.414Z');
    }

    // Verify quest results persistence as objects
    expect(scanRunData?.questResults).toBeDefined();
    expect(scanRunData?.questResults['docs.agents_md_present']).toEqual({ present: true });
    expect(scanRunData?.questResults['sast.semgrep_present']).toEqual({ present: false });
    expect(scanRunData?.questResults['quality.coverage_threshold_met']).toEqual({
      meets_threshold: false,
    });
  });

  it('should handle missing request body with 400 error', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad Request');
  });

  it('should handle invalid request body with 400 error', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: { invalid: 'data' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad Request');
  });

  it('should handle multiple ingestion requests for same repo', async () => {
    // First ingestion
    const response1 = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: sampleReport,
    });

    expect(response1.statusCode).toBe(200);
    const body1 = JSON.parse(response1.body) as IngestScanResponseDto;

    // Second ingestion with different commit
    const updatedReport = {
      ...sampleReport,
      metadata: {
        ...sampleReport.metadata,
        repository: {
          ...sampleReport.metadata.repository,
          commit_sha: 'abc123def456',
          run_id: '21545800680',
          run_url: 'https://github.com/ynk024/Workouttrackerdesign/actions/runs/21545800680',
        },
        timestamp: '2026-01-31T18:00:00.000Z',
      },
    };

    const response2 = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: updatedReport,
    });

    expect(response2.statusCode).toBe(200);
    const body2 = JSON.parse(response2.body) as IngestScanResponseDto;

    // Should have different scan run IDs
    expect(body1.scanRunId).not.toBe(body2.scanRunId);

    // Should share same team and repo
    expect(body1.teamId).toBe(body2.teamId);
    expect(body1.repoId).toBe(body2.repoId);

    // Verify both scan runs exist in Firestore
    const firestoreClient = server.firestoreClient;
    const scanRun1Doc = await firestoreClient.document('scanRuns', body1.scanRunId).get();
    const scanRun2Doc = await firestoreClient.document('scanRuns', body2.scanRunId).get();

    expect(scanRun1Doc.exists).toBe(true);
    expect(scanRun2Doc.exists).toBe(true);
  });

  it('should return valid JSON with correct content-type', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: sampleReport,
    });

    const contentType = response.headers['content-type'];
    expect(contentType).toBeDefined();
    expect(typeof contentType === 'string' ? contentType : '').toContain('application/json');

    const parsedBody = JSON.parse(response.body) as IngestScanResponseDto;
    expect(parsedBody).toBeDefined();
  });

  it('should return 400 for unsupported programming language', async () => {
    const reportWithUnsupportedLanguage = {
      ...sampleReport,
      metadata: {
        ...sampleReport.metadata,
        languages: {
          primary: 'python',
        },
      },
    };

    const response = await server.inject({
      method: 'POST',
      url: '/api/ingest-scan',
      payload: reportWithUnsupportedLanguage,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad Request');
    expect(body.message).toContain('Invalid programming language');
    expect(body.message).toContain('python');
  });
});
