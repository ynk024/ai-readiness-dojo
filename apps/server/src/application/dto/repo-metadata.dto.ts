/**
 * Repository metadata DTO for application layer.
 *
 * Represents repository and scan context information needed across
 * multiple use cases and services.
 *
 * Pure data structure - no validation logic.
 */
export interface RepoMetadata {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  commitSha: string;
  refName: string;
  providerRunId: string;
  runUrl: string;
  workflowVersion: string;
  scannedAt: Date;
}
