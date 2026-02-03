import { ScanResult } from '../../domain/scan-run/scan-value-objects.js';

import type { IngestScanRunDto } from '../../application/dto/ingest-scan-run.dto.js';
import type { RepoMetadata } from '../../application/dto/repo-metadata.dto.js';
import type { IngestScanRequestDto } from '../dto/ingest-scan.dto.js';

const EXPECTED_NAME_PARTS = 2;

/**
 * Extract repository metadata from ingest scan request
 * @param request - The ingest scan request DTO
 * @returns Repository metadata
 * @throws Error if repository name format is invalid or timestamp is invalid
 */
function extractRepoMetadata(request: IngestScanRequestDto): RepoMetadata {
  const { repository, timestamp, workflow_version: workflowVersion, languages } = request.metadata;

  // Parse repository name (format: "owner/repo-name")
  const nameParts = repository.name.split('/');
  if (nameParts.length !== EXPECTED_NAME_PARTS || !nameParts[0] || !nameParts[1]) {
    throw new Error('Invalid repository name format: expected "owner/repo-name"');
  }

  const owner = nameParts[0];
  const name = nameParts[1];

  // Parse timestamp
  const scannedAt = new Date(timestamp);
  if (isNaN(scannedAt.getTime())) {
    throw new Error('Invalid timestamp format');
  }

  return {
    owner,
    name,
    fullName: repository.name,
    url: repository.url,
    commitSha: repository.commit_sha,
    refName: repository.branch,
    providerRunId: repository.run_id,
    runUrl: repository.run_url,
    workflowVersion,
    scannedAt,
    primaryLanguage: languages?.primary ?? null,
  };
}

/**
 * Add documentation quest results to the results map
 */
function addDocumentationResults(
  results: Map<string, ScanResult>,
  documentation: IngestScanRequestDto['checks']['documentation'],
): void {
  if (documentation?.agents_md !== undefined) {
    results.set(
      'docs.agents_md_present',
      ScanResult.create({ present: documentation.agents_md.present }),
    );
  }

  if (documentation?.skill_md !== undefined) {
    results.set('docs.skill_md_count', ScanResult.create({ count: documentation.skill_md.count }));
  }
}

/**
 * Add formatter quest results to the results map
 */
function addFormatterResults(
  results: Map<string, ScanResult>,
  formatters: IngestScanRequestDto['checks']['formatters'],
): void {
  if (formatters?.javascript?.prettier !== undefined) {
    results.set(
      'formatters.javascript.prettier_present',
      ScanResult.create({ present: formatters.javascript.prettier.present }),
    );
  }
}

/**
 * Add linting quest results to the results map
 */
function addLintingResults(
  results: Map<string, ScanResult>,
  linting: IngestScanRequestDto['checks']['linting'],
): void {
  if (linting?.javascript?.eslint !== undefined) {
    results.set(
      'linting.javascript.eslint_present',
      ScanResult.create({ present: linting.javascript.eslint.present }),
    );
  }
}

/**
 * Add SAST quest results to the results map
 */
function addSastResults(
  results: Map<string, ScanResult>,
  sast: IngestScanRequestDto['checks']['sast'],
): void {
  if (sast?.codeql !== undefined) {
    results.set('sast.codeql_present', ScanResult.create({ present: sast.codeql.present }));
  }

  if (sast?.semgrep !== undefined) {
    results.set('sast.semgrep_present', ScanResult.create({ present: sast.semgrep.present }));
  }
}

/**
 * Add test coverage quest results to the results map
 */
function addCoverageResults(
  results: Map<string, ScanResult>,
  coverage: IngestScanRequestDto['checks']['test_coverage'],
): void {
  if (coverage?.available !== undefined) {
    results.set('quality.coverage_available', ScanResult.create({ available: coverage.available }));
  }

  if (coverage?.meets_threshold !== undefined) {
    const data: Record<string, unknown> = {
      meets_threshold: coverage.meets_threshold,
    };

    if (coverage.coverage?.lines.percentage !== undefined) {
      data.score = coverage.coverage.lines.percentage;
    }

    results.set('quality.coverage_threshold_met', ScanResult.create(data));
  }
}

/**
 * Extract quest results from ingest scan request checks
 * Maps the nested checks structure to flat quest keys with unopinionated data
 *
 * Quest key mapping:
 * - documentation.agents_md.present → "docs.agents_md_present"
 * - documentation.skill_md.count → "docs.skill_md_count" (pass if > 0)
 * - formatters.javascript.prettier.present → "formatters.javascript.prettier_present"
 * - linting.javascript.eslint.present → "linting.javascript.eslint_present"
 * - sast.codeql.present → "sast.codeql_present"
 * - sast.semgrep.present → "sast.semgrep_present"
 * - test_coverage.available → "quality.coverage_available"
 * - test_coverage.meets_threshold → "quality.coverage_threshold_met"
 *
 * @param request - The ingest scan request DTO
 * @returns Map of quest keys to quest status
 */
function extractQuestResults(request: IngestScanRequestDto): Map<string, ScanResult> {
  const results = new Map<string, ScanResult>();
  const { checks } = request;

  addDocumentationResults(results, checks.documentation);
  addFormatterResults(results, checks.formatters);
  addLintingResults(results, checks.linting);
  addSastResults(results, checks.sast);
  addCoverageResults(results, checks.test_coverage);

  return results;
}

/**
 * Map IngestScanRequestDto (HTTP format) to IngestScanRunDto (application format)
 *
 * Transforms HTTP request DTOs into application-layer DTOs.
 * This sits at the boundary between presentation and application layers.
 *
 * @param request - Ingest scan request from HTTP
 * @returns Application-layer DTO ready for use case execution
 */
export function toApplicationDto(request: IngestScanRequestDto): IngestScanRunDto {
  const metadata = extractRepoMetadata(request);
  const questResults = extractQuestResults(request);

  return {
    metadata,
    questResults,
  };
}
