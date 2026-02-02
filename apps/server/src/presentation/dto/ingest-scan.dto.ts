/**
 * Ingest Scan DTOs (Data Transfer Objects)
 *
 * DTOs for the presentation layer. These decouple the API contracts
 * from the domain models, allowing independent evolution.
 */

/**
 * Request DTO for ingesting a scan run
 * Matches the external AI-Readiness report format from the ai-readiness-action
 */
export interface IngestScanRequestDto {
  metadata: {
    repository: {
      name: string; // Format: "owner/repo-name"
      url: string;
      commit_sha: string;
      branch: string;
      run_id: string;
      run_url: string;
    };
    timestamp: string; // ISO 8601 format
    workflow_version: string;
  };
  checks: {
    documentation?: {
      agents_md?: { present: boolean };
      skill_md?: { count: number };
    };
    formatters?: {
      javascript?: {
        prettier?: { present: boolean };
      };
    };
    linting?: {
      javascript?: {
        eslint?: { present: boolean };
      };
    };
    sast?: {
      codeql?: { present: boolean };
      semgrep?: { present: boolean };
    };
    test_coverage?: {
      available: boolean;
      meets_threshold: boolean;
      coverage?: {
        lines: {
          percentage: number;
        };
      };
    };
  };
}

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
