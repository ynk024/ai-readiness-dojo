import { FastifyPluginAsync } from 'fastify';

import { RepoId } from '../../domain/shared/repo-types.js';
import { RepoReadinessResponseDto } from '../dto/repo-readiness.dto.js';

// HTTP Status codes
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// Error messages
const ERROR_NOT_FOUND = 'Not Found';
const ERROR_INTERNAL_SERVER = 'Internal Server Error';

/**
 * Repo Readiness Routes
 *
 * Provides endpoints for querying repository AI readiness snapshots
 */
// eslint-disable-next-line @typescript-eslint/require-await
export const repoReadinessRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /repos/:repoId/readiness
   * Returns the latest readiness snapshot for a repository
   */
  fastify.get<{ Params: { repoId: string } }>(
    '/repos/:repoId/readiness',
    async (request, reply) => {
      try {
        const { repoId } = request.params;

        // Fetch readiness from repository
        const readiness = await fastify.repoReadinessRepository.findByRepoId(RepoId.create(repoId));

        if (!readiness) {
          return await reply.code(HTTP_NOT_FOUND).send({
            error: ERROR_NOT_FOUND,
            message: `No readiness data found for repository: ${repoId}`,
          });
        }

        // Convert to DTO
        const questsRecord: Record<
          string,
          {
            status: 'complete' | 'incomplete' | 'unknown';
            level: number;
            lastSeenAt: string;
          }
        > = {};

        for (const [key, entry] of readiness.quests) {
          questsRecord[key] = {
            status: entry.status.value as 'complete' | 'incomplete' | 'unknown',
            level: entry.level,
            lastSeenAt: entry.lastSeenAt.toISOString(),
          };
        }

        const dto: RepoReadinessResponseDto = {
          repoId: readiness.repoId.value,
          teamId: readiness.teamId.value,
          computedFromScanRunId: readiness.computedFromScanRunId.value,
          updatedAt: readiness.updatedAt.toISOString(),
          summary: {
            totalQuests: readiness.getTotalQuests(),
            completedQuests: readiness.getCompletedQuests().length,
            completionPercentage: readiness.getCompletionPercentage(),
          },
          quests: questsRecord,
        };

        return await reply.code(HTTP_OK).send(dto);
      } catch (error) {
        fastify.log.error(error, 'Error fetching repo readiness');

        return reply.code(HTTP_INTERNAL_SERVER_ERROR).send({
          error: ERROR_INTERNAL_SERVER,
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      }
    },
  );
};
