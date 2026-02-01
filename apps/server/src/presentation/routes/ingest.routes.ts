import { IngestScanRunUseCase } from '../../application/use-cases/ingest-scan-run.use-case.js';

import type { IngestScanRequestDto, IngestScanResponseDto } from '../dto/ingest-scan.dto.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Ingest Routes - Driving Adapter
 *
 * HTTP endpoints that drive the application core through repository ports.
 * This is the driving side of hexagonal architecture.
 */

// HTTP Status codes
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// Route paths
const INGEST_SCAN_PATH = '/ingest-scan';

// Error messages
const ERROR_BAD_REQUEST = 'Bad Request';
const ERROR_INTERNAL_SERVER = 'Internal Server Error';

/**
 * Type guard to check if body is a valid IngestScanRequestDto
 */
function isValidIngestScanRequest(body: unknown): body is IngestScanRequestDto {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const req = body as Partial<IngestScanRequestDto>;
  return Boolean(req.metadata && req.checks);
}

/**
 * POST /api/ingest-scan - Ingest an AI-Readiness scan run
 */
async function ingestScan(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<IngestScanResponseDto | undefined> {
  try {
    // Runtime validation with type guard
    if (!isValidIngestScanRequest(request.body)) {
      return await reply.code(HTTP_BAD_REQUEST).send({
        error: ERROR_BAD_REQUEST,
        message: 'Invalid request body: missing required fields (metadata, checks)',
      });
    }

    // Create use case instance with repository dependencies
    const useCase = new IngestScanRunUseCase(
      fastify.teamRepository,
      fastify.repoRepository,
      fastify.scanRunRepository,
    );

    // Execute use case
    const result = await useCase.execute(request.body);

    // Return response
    return await reply.code(HTTP_OK).send({
      scanRunId: result.scanRunId,
      teamId: result.teamId,
      repoId: result.repoId,
      summary: result.summary,
    });
  } catch (error) {
    // Log error for debugging
    fastify.log.error(error, 'Error ingesting scan run');

    // Return generic error response
    return await reply.code(HTTP_INTERNAL_SERVER_ERROR).send({
      error: ERROR_INTERNAL_SERVER,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
}

/**
 * Register all ingest routes
 */
export function ingestRoutes(fastify: FastifyInstance): void {
  fastify.post<{ Body: IngestScanRequestDto }>(INGEST_SCAN_PATH, async (request, reply) =>
    ingestScan(fastify, request, reply),
  );
}
