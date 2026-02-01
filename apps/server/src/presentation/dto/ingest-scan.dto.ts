import type { AiReadinessReport } from '../../application/mappers/ai-readiness-report-mapper.js';

/**
 * Ingest Scan DTOs (Data Transfer Objects)
 *
 * DTOs for the presentation layer. These decouple the API contracts
 * from the domain models, allowing independent evolution.
 */

/**
 * Request DTO for ingesting a scan run
 * Matches the external AI-Readiness report format
 */
export type IngestScanRequestDto = AiReadinessReport;

/**
 * Response DTO for scan ingestion
 */
export interface IngestScanResponseDto {
  scanRunId: string;
  teamId: string;
  repoId: string;
  summary: {
    totalQuests: number;
    passedQuests: number;
    failedQuests: number;
  };
}
