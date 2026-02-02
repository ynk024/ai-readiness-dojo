import fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { RepoReadinessRepository } from '../../../src/application/ports/repo-readiness-repository.js';
import {
  ReadinessStatus,
  createQuestReadinessEntry,
} from '../../../src/domain/repo-readiness/repo-readiness-value-objects.js';
import { RepoReadiness } from '../../../src/domain/repo-readiness/repo-readiness.js';
import { ScanRunId } from '../../../src/domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId } from '../../../src/domain/shared/index.js';
import { repoReadinessRoutes } from '../../../src/presentation/routes/repo-readiness.routes.js';

const mockFindByRepoId = vi.fn();

declare module 'fastify' {
  interface FastifyInstance {
    repoReadinessRepository: RepoReadinessRepository;
  }
}

describe('RepoReadiness Routes', () => {
  const createApp = async () => {
    const app = fastify();

    app.decorate('repoReadinessRepository', {
      findByRepoId: mockFindByRepoId,
    } as unknown as RepoReadinessRepository);

    await app.register(repoReadinessRoutes, { prefix: '/api' });

    return app;
  };

  it('GET /api/repos/:repoId/readiness returns readiness data', async () => {
    const app = await createApp();

    const questsMap = new Map<string, ReturnType<typeof createQuestReadinessEntry>>([
      ['git-basics', createQuestReadinessEntry(ReadinessStatus.complete(), 1, new Date())],
      ['readme', createQuestReadinessEntry(ReadinessStatus.complete(), 2, new Date())],
    ]);

    const readiness = RepoReadiness.reconstitute({
      repoId: RepoId.create('repo_testorg_project1'),
      teamId: TeamId.create('team_testorg'),
      computedFromScanRunId: ScanRunId.create('scan-123'),
      updatedAt: new Date('2024-06-15T10:30:00.000Z'),
      quests: questsMap,
    });

    mockFindByRepoId.mockResolvedValue(readiness);

    const response = await app.inject({
      method: 'GET',
      url: '/api/repos/repo_testorg_project1/readiness',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.repoId).toBe('repo_testorg_project1');
    expect(body.teamId).toBe('team_testorg');
    expect(body.computedFromScanRunId).toBe('scan-123');
    expect(body.summary.totalQuests).toBe(2);
    expect(body.summary.completedQuests).toBe(2);
    expect(body.summary.completionPercentage).toBe(100);
    expect(body.quests['git-basics'].status).toBe('complete');
    expect(body.quests['git-basics'].level).toBe(1);
    expect(body.quests['readme'].status).toBe('complete');
    expect(body.quests['readme'].level).toBe(2);
  });

  it('GET /api/repos/:repoId/readiness returns 404 when not found', async () => {
    const app = await createApp();

    mockFindByRepoId.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/repos/nonexistent_repo/readiness',
    });

    expect(response.statusCode).toBe(404);

    const body = JSON.parse(response.body);
    expect(body.error).toBe('Not Found');
    expect(body.message).toContain('nonexistent_repo');
  });

  it('GET /api/repos/:repoId/readiness returns 500 when repository fails', async () => {
    const app = await createApp();

    mockFindByRepoId.mockRejectedValue(new Error('Database error'));

    const response = await app.inject({
      method: 'GET',
      url: '/api/repos/repo_testorg_project1/readiness',
    });

    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body.error).toBe('Internal Server Error');
    expect(body.message).toBe('Database error');
  });

  it('GET /api/repos/:repoId/readiness handles partial quest completion', async () => {
    const app = await createApp();

    const questsMap = new Map<string, ReturnType<typeof createQuestReadinessEntry>>([
      ['git-basics', createQuestReadinessEntry(ReadinessStatus.complete(), 1, new Date())],
      ['readme', createQuestReadinessEntry(ReadinessStatus.incomplete(), 1, new Date())],
      ['tests', createQuestReadinessEntry(ReadinessStatus.complete(), 3, new Date())],
    ]);

    const readiness = RepoReadiness.reconstitute({
      repoId: RepoId.create('repo_testorg_project1'),
      teamId: TeamId.create('team_testorg'),
      computedFromScanRunId: ScanRunId.create('scan-456'),
      updatedAt: new Date(),
      quests: questsMap,
    });

    mockFindByRepoId.mockResolvedValue(readiness);

    const response = await app.inject({
      method: 'GET',
      url: '/api/repos/repo_testorg_project1/readiness',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.summary.totalQuests).toBe(3);
    expect(body.summary.completedQuests).toBe(2);
    expect(body.summary.completionPercentage).toBe(67);
  });

  it('GET /api/repos/:repoId/readiness handles empty quests', async () => {
    const app = await createApp();

    const readiness = RepoReadiness.reconstitute({
      repoId: RepoId.create('repo_testorg_project1'),
      teamId: TeamId.create('team_testorg'),
      computedFromScanRunId: ScanRunId.create('scan-789'),
      updatedAt: new Date(),
      quests: new Map(),
    });

    mockFindByRepoId.mockResolvedValue(readiness);

    const response = await app.inject({
      method: 'GET',
      url: '/api/repos/repo_testorg_project1/readiness',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.summary.totalQuests).toBe(0);
    expect(body.summary.completedQuests).toBe(0);
    expect(body.summary.completionPercentage).toBe(0);
    expect(body.quests).toEqual({});
  });
});
