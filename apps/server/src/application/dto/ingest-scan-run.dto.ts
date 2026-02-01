import type { RepoMetadata } from './repo-metadata.dto.js';
import type { QuestStatus } from '../../domain/value-objects/scan-value-objects.js';

/**
 * Application-layer DTO for ingesting a scan run.
 *
 * This DTO decouples the use case from external API formats (HTTP, GraphQL, etc.)
 * It represents exactly what the IngestScanRunUseCase needs to execute.
 *
 * Pure data structure - no validation logic (validation happens in domain layer)
 */
export interface IngestScanRunDto {
  // Repository and scan metadata
  metadata: RepoMetadata;

  // Quest results (using domain value object)
  questResults: Map<string, QuestStatus>;
}
