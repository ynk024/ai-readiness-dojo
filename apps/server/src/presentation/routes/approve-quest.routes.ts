import { FastifyPluginAsync, FastifyReply } from 'fastify';

import { RepoId, TeamId, UserId } from '../../domain/shared/index.js';
import { ApproveQuestRequestDto, ApproveQuestResponseDto } from '../dto/approve-quest.dto.js';

// HTTP Status codes
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// Error messages
const ERROR_BAD_REQUEST = 'Bad Request';
const ERROR_NOT_FOUND = 'Not Found';
const ERROR_INTERNAL_SERVER = 'Internal Server Error';

/**
 * Handle errors from quest approval
 */
async function handleApprovalError(error: unknown, reply: FastifyReply): Promise<void> {
  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      await reply.code(HTTP_NOT_FOUND).send({
        error: ERROR_NOT_FOUND,
        message: error.message,
      });
      return;
    }

    if (error.message.includes('does not allow manual approval')) {
      await reply.code(HTTP_BAD_REQUEST).send({
        error: ERROR_BAD_REQUEST,
        message: error.message,
      });
      return;
    }
  }

  await reply.code(HTTP_INTERNAL_SERVER_ERROR).send({
    error: ERROR_INTERNAL_SERVER,
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  });
}

/**
 * Approve Quest Routes
 *
 * Provides endpoints for manually approving quests
 */
// eslint-disable-next-line @typescript-eslint/require-await
export const approveQuestRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /repos/:repoId/quests/approve
   * Manually approve a quest for a repository
   */
  fastify.post<{
    Params: { repoId: string };
    Body: ApproveQuestRequestDto;
  }>('/repos/:repoId/quests/approve', async (request, reply) => {
    try {
      const { repoId } = request.params;
      const { questKey, level, approvedBy } = request.body;

      // Validate required fields
      if (!questKey || !approvedBy) {
        return await reply.code(HTTP_BAD_REQUEST).send({
          error: ERROR_BAD_REQUEST,
          message: 'questKey and approvedBy are required',
        });
      }

      // Get team from repo (repos are nested in teams in this architecture)
      // We need to infer the teamId - for now we'll require it in the request
      // or fetch it from the repo entity
      const teamId = request.body.teamId as string | undefined;
      if (!teamId) {
        return await reply.code(HTTP_BAD_REQUEST).send({
          error: ERROR_BAD_REQUEST,
          message: 'teamId is required',
        });
      }

      // Execute use case
      const readiness = await fastify.useCases.approveQuestManually().execute({
        repoId: RepoId.create(repoId),
        teamId: TeamId.create(teamId),
        questKey,
        approvedBy: UserId.create(approvedBy),
        level,
      });

      // Get the approved quest entry
      const questEntry = readiness.getQuestStatus(questKey);
      if (!questEntry || !questEntry.manualApproval) {
        return await reply.code(HTTP_INTERNAL_SERVER_ERROR).send({
          error: ERROR_INTERNAL_SERVER,
          message: 'Failed to approve quest',
        });
      }

      // Convert to DTO
      const dto: ApproveQuestResponseDto = {
        repoId: readiness.repoId.value,
        teamId: readiness.teamId.value,
        questKey,
        level: questEntry.level,
        approvedBy: questEntry.manualApproval.approvedBy.value,
        approvedAt: questEntry.manualApproval.approvedAt.toISOString(),
      };

      return await reply.code(HTTP_OK).send(dto);
    } catch (error) {
      fastify.log.error(error, 'Error approving quest');
      return handleApprovalError(error, reply);
    }
  });
};
