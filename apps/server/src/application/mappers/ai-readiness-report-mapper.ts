import { QuestStatus } from '../../domain/value-objects/scan-value-objects.js';

/**
 * Type definition for AI-Readiness Report JSON structure
 * This represents the external format from the ai-readiness-action
 */
export interface AiReadinessReport {
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
    };
  };
}

/**
 * Repository metadata extracted from AI-Readiness Report
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

const EXPECTED_NAME_PARTS = 2;

/**
 * Extract repository metadata from AI-Readiness Report
 * @param report - The AI-Readiness report
 * @returns Repository metadata
 * @throws Error if repository name format is invalid or timestamp is invalid
 */
function extractRepoMetadata(report: AiReadinessReport): RepoMetadata {
  const { repository, timestamp, workflow_version: workflowVersion } = report.metadata;

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
  };
}

/**
 * Add documentation quest results to the results map
 */
function addDocumentationResults(
  results: Map<string, QuestStatus>,
  documentation: AiReadinessReport['checks']['documentation'],
): void {
  if (documentation?.agents_md !== undefined) {
    const status = documentation.agents_md.present ? QuestStatus.pass() : QuestStatus.fail();
    results.set('docs.agents_md_present', status);
  }

  if (documentation?.skill_md !== undefined) {
    const passThreshold = 0;
    const hasSkills = documentation.skill_md.count > passThreshold;
    const status = hasSkills ? QuestStatus.pass() : QuestStatus.fail();
    results.set('docs.skill_md_count', status);
  }
}

/**
 * Add formatter quest results to the results map
 */
function addFormatterResults(
  results: Map<string, QuestStatus>,
  formatters: AiReadinessReport['checks']['formatters'],
): void {
  if (formatters?.javascript?.prettier !== undefined) {
    const status = formatters.javascript.prettier.present ? QuestStatus.pass() : QuestStatus.fail();
    results.set('formatters.javascript.prettier_present', status);
  }
}

/**
 * Add linting quest results to the results map
 */
function addLintingResults(
  results: Map<string, QuestStatus>,
  linting: AiReadinessReport['checks']['linting'],
): void {
  if (linting?.javascript?.eslint !== undefined) {
    const status = linting.javascript.eslint.present ? QuestStatus.pass() : QuestStatus.fail();
    results.set('linting.javascript.eslint_present', status);
  }
}

/**
 * Add SAST quest results to the results map
 */
function addSastResults(
  results: Map<string, QuestStatus>,
  sast: AiReadinessReport['checks']['sast'],
): void {
  if (sast?.codeql !== undefined) {
    const status = sast.codeql.present ? QuestStatus.pass() : QuestStatus.fail();
    results.set('sast.codeql_present', status);
  }

  if (sast?.semgrep !== undefined) {
    const status = sast.semgrep.present ? QuestStatus.pass() : QuestStatus.fail();
    results.set('sast.semgrep_present', status);
  }
}

/**
 * Add test coverage quest results to the results map
 */
function addCoverageResults(
  results: Map<string, QuestStatus>,
  coverage: AiReadinessReport['checks']['test_coverage'],
): void {
  if (coverage?.available !== undefined) {
    const status = coverage.available ? QuestStatus.pass() : QuestStatus.fail();
    results.set('quality.coverage_available', status);
  }

  if (coverage?.meets_threshold !== undefined) {
    const status = coverage.meets_threshold ? QuestStatus.pass() : QuestStatus.fail();
    results.set('quality.coverage_threshold_met', status);
  }
}

/**
 * Extract quest results from AI-Readiness Report checks
 * Maps the nested checks structure to flat quest keys with pass/fail/unknown status
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
 * @param report - The AI-Readiness report
 * @returns Map of quest keys to quest status
 */
function extractQuestResults(report: AiReadinessReport): Map<string, QuestStatus> {
  const results = new Map<string, QuestStatus>();
  const { checks } = report;

  addDocumentationResults(results, checks.documentation);
  addFormatterResults(results, checks.formatters);
  addLintingResults(results, checks.linting);
  addSastResults(results, checks.sast);
  addCoverageResults(results, checks.test_coverage);

  return results;
}

/**
 * Mapper for transforming AI-Readiness Reports from external JSON format
 * to domain types (value objects, entities)
 */
export const AiReadinessReportMapper = {
  extractRepoMetadata,
  extractQuestResults,
};
