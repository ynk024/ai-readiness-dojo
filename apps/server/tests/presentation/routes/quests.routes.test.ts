import fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { QuestRepository } from '../../../src/application/ports/quest-repository.js';
import { QuestId } from '../../../src/domain/quest/quest-value-objects.js';
import { Quest } from '../../../src/domain/quest/quest.js';
import { QuestResponseDto } from '../../../src/presentation/dto/quest.dto.js';
import { questsRoutes } from '../../../src/presentation/routes/quests.routes.js';

// Mock the quest repository
const mockFindActive = vi.fn();

// Add type augmentation for FastifyInstance
declare module 'fastify' {
  interface FastifyInstance {
    questRepository: QuestRepository;
  }
}

describe('Quest Routes', () => {
  const createApp = async () => {
    const app = fastify();

    // Register mock repository
    // We cast to any because we're only mocking part of the interface for this test
    app.decorate('questRepository', {
      findActive: mockFindActive,
    } as unknown as QuestRepository);

    // Register routes
    await app.register(questsRoutes, { prefix: '/api' });

    return app;
  };

  it('GET /api/quests returns active quests sorted by category and key', async () => {
    const app = await createApp();

    // Create test data
    const quest1 = Quest.reconstitute({
      id: QuestId.create('id-1'),
      key: 'git-basics',
      title: 'Git Basics',
      category: 'Version Control',
      description: 'Learn git',
      active: true,
      levels: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const quest2 = Quest.reconstitute({
      id: QuestId.create('id-2'),
      key: 'advanced-git',
      title: 'Advanced Git',
      category: 'Version Control',
      description: 'Learn advanced git',
      active: true,
      levels: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const quest3 = Quest.reconstitute({
      id: QuestId.create('id-3'),
      key: 'clean-code',
      title: 'Clean Code',
      category: 'Architecture',
      description: 'Write clean code',
      active: true,
      levels: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock return value (unordered to test sorting)
    mockFindActive.mockResolvedValue([quest2, quest3, quest1]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/quests',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body) as QuestResponseDto[];
    expect(body).toHaveLength(3);

    // Verify sorting: Category (Architecture < Version Control), then Key (advanced-git < git-basics)
    expect(body[0]?.key).toBe('clean-code'); // Architecture
    expect(body[1]?.key).toBe('advanced-git'); // Version Control, a comes before g
    expect(body[2]?.key).toBe('git-basics'); // Version Control

    // Verify DTO structure
    expect(body[0]).toEqual({
      id: 'id-3',
      key: 'clean-code',
      title: 'Clean Code',
      category: 'Architecture',
      description: 'Write clean code',
      active: true,
      detectionType: 'both',
      levels: [],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('GET /api/quests returns 500 when repository fails', async () => {
    const app = await createApp();

    mockFindActive.mockRejectedValue(new Error('Database error'));

    const response = await app.inject({
      method: 'GET',
      url: '/api/quests',
    });

    expect(response.statusCode).toBe(500);
  });
});
