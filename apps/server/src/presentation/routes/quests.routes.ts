import { FastifyPluginAsync } from 'fastify';

import { QuestResponseDto } from '../dto/quest.dto.js';

// eslint-disable-next-line @typescript-eslint/require-await
export const questsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/quests', async (_request, reply) => {
    const quests = await fastify.questRepository.findActive();

    const dtos: QuestResponseDto[] = quests
      .map((quest) => ({
        id: quest.id.value,
        key: quest.key,
        title: quest.title,
        category: quest.category,
        description: quest.description,
        active: quest.active,
        createdAt: quest.createdAt.toISOString(),
        updatedAt: quest.updatedAt.toISOString(),
      }))
      .sort((a, b) => {
        // Sort by category first
        const categoryComparison = a.category.localeCompare(b.category);
        if (categoryComparison !== 0) {
          return categoryComparison;
        }
        // Then by key
        return a.key.localeCompare(b.key);
      });

    return reply.send(dtos);
  });
};
