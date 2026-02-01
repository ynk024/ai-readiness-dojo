import { describe, it, expect } from 'vitest';

import {
  AiReadinessReportMapper,
  type AiReadinessReport,
} from '../../../src/application/mappers/ai-readiness-report-mapper.js';
import { QuestStatus } from '../../../src/domain/value-objects/scan-value-objects.js';

describe('AiReadinessReportMapper', () => {
  const sampleReport: AiReadinessReport = {
    metadata: {
      repository: {
        name: 'ynk024/Workouttrackerdesign',
        url: 'https://github.com/ynk024/Workouttrackerdesign',
        commit_sha: '7a0137597745d539fd41e88b85779eccf118afcc',
        branch: 'main',
        run_id: '21545800679',
        run_url: 'https://github.com/ynk024/Workouttrackerdesign/actions/runs/21545800679',
      },
      timestamp: '2026-01-31T17:39:21.414Z',
      workflow_version: '1.0.0',
    },
    checks: {
      documentation: {
        agents_md: { present: true },
        skill_md: { count: 1 },
      },
      formatters: {
        javascript: { prettier: { present: true } },
      },
      linting: {
        javascript: { eslint: { present: true } },
      },
      sast: {
        codeql: { present: true },
        semgrep: { present: false },
      },
      test_coverage: {
        available: true,
        meets_threshold: false,
      },
    },
  };

  describe('extractRepoMetadata', () => {
    it('should extract repository metadata from report', () => {
      const metadata = AiReadinessReportMapper.extractRepoMetadata(sampleReport);

      expect(metadata.fullName).toBe('ynk024/Workouttrackerdesign');
      expect(metadata.url).toBe('https://github.com/ynk024/Workouttrackerdesign');
      expect(metadata.commitSha).toBe('7a0137597745d539fd41e88b85779eccf118afcc');
      expect(metadata.refName).toBe('main');
      expect(metadata.providerRunId).toBe('21545800679');
      expect(metadata.runUrl).toBe(
        'https://github.com/ynk024/Workouttrackerdesign/actions/runs/21545800679',
      );
      expect(metadata.workflowVersion).toBe('1.0.0');
      expect(metadata.scannedAt).toBeInstanceOf(Date);
      expect(metadata.scannedAt.toISOString()).toBe('2026-01-31T17:39:21.414Z');
    });

    it('should extract owner from repository name', () => {
      const metadata = AiReadinessReportMapper.extractRepoMetadata(sampleReport);

      expect(metadata.owner).toBe('ynk024');
    });

    it('should extract repo name without owner', () => {
      const metadata = AiReadinessReportMapper.extractRepoMetadata(sampleReport);

      expect(metadata.name).toBe('Workouttrackerdesign');
    });

    it('should handle refs/heads/ prefix in branch name', () => {
      const reportWithRef: AiReadinessReport = {
        ...sampleReport,
        metadata: {
          ...sampleReport.metadata,
          repository: {
            ...sampleReport.metadata.repository,
            branch: 'refs/heads/feature-branch',
          },
        },
      };

      const metadata = AiReadinessReportMapper.extractRepoMetadata(reportWithRef);

      expect(metadata.refName).toBe('refs/heads/feature-branch');
    });

    it('should throw error if repository name is missing owner', () => {
      const invalidReport: AiReadinessReport = {
        ...sampleReport,
        metadata: {
          ...sampleReport.metadata,
          repository: {
            ...sampleReport.metadata.repository,
            name: 'NoOwner',
          },
        },
      };

      expect(() => AiReadinessReportMapper.extractRepoMetadata(invalidReport)).toThrow(
        'Invalid repository name format',
      );
    });

    it('should throw error if timestamp is invalid', () => {
      const invalidReport: AiReadinessReport = {
        ...sampleReport,
        metadata: {
          ...sampleReport.metadata,
          timestamp: 'invalid-date',
        },
      };

      expect(() => AiReadinessReportMapper.extractRepoMetadata(invalidReport)).toThrow(
        'Invalid timestamp format',
      );
    });
  });

  describe('extractQuestResults', () => {
    it('should map documentation.agents_md.present to quest status', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      const status = questResults.get('docs.agents_md_present');
      expect(status).toBeDefined();
      expect(status?.isPass()).toBe(true);
    });

    it('should map documentation.skill_md.count to quest status (pass when > 0)', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      const status = questResults.get('docs.skill_md_count');
      expect(status).toBeDefined();
      expect(status?.isPass()).toBe(true);
    });

    it('should map documentation.skill_md.count to fail when 0', () => {
      const reportWithNoSkills: AiReadinessReport = {
        ...sampleReport,
        checks: {
          ...sampleReport.checks,
          documentation: {
            agents_md: { present: true },
            skill_md: { count: 0 },
          },
        },
      };

      const questResults = AiReadinessReportMapper.extractQuestResults(reportWithNoSkills);

      const status = questResults.get('docs.skill_md_count');
      expect(status).toBeDefined();
      expect(status?.isFail()).toBe(true);
    });

    it('should map formatters.javascript.prettier.present to quest status', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      const status = questResults.get('formatters.javascript.prettier_present');
      expect(status).toBeDefined();
      expect(status?.isPass()).toBe(true);
    });

    it('should map linting.javascript.eslint.present to quest status', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      const status = questResults.get('linting.javascript.eslint_present');
      expect(status).toBeDefined();
      expect(status?.isPass()).toBe(true);
    });

    it('should map sast.codeql.present to quest status (pass)', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      const status = questResults.get('sast.codeql_present');
      expect(status).toBeDefined();
      expect(status?.isPass()).toBe(true);
    });

    it('should map sast.semgrep.present to quest status (fail)', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      const status = questResults.get('sast.semgrep_present');
      expect(status).toBeDefined();
      expect(status?.isFail()).toBe(true);
    });

    it('should map test_coverage.available to quest status', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      const status = questResults.get('quality.coverage_available');
      expect(status).toBeDefined();
      expect(status?.isPass()).toBe(true);
    });

    it('should map test_coverage.meets_threshold to quest status', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      const status = questResults.get('quality.coverage_threshold_met');
      expect(status).toBeDefined();
      expect(status?.isFail()).toBe(true);
    });

    it('should handle missing documentation section', () => {
      const reportWithoutDocs: AiReadinessReport = {
        ...sampleReport,
        checks: {
          formatters: sampleReport.checks.formatters,
          linting: sampleReport.checks.linting,
          sast: sampleReport.checks.sast,
          test_coverage: sampleReport.checks.test_coverage,
        },
      };

      const questResults = AiReadinessReportMapper.extractQuestResults(reportWithoutDocs);

      expect(questResults.has('docs.agents_md_present')).toBe(false);
      expect(questResults.has('docs.skill_md_count')).toBe(false);
    });

    it('should handle missing formatters section', () => {
      const reportWithoutFormatters: AiReadinessReport = {
        ...sampleReport,
        checks: {
          documentation: sampleReport.checks.documentation,
          linting: sampleReport.checks.linting,
          sast: sampleReport.checks.sast,
          test_coverage: sampleReport.checks.test_coverage,
        },
      };

      const questResults = AiReadinessReportMapper.extractQuestResults(reportWithoutFormatters);

      expect(questResults.has('formatters.javascript.prettier_present')).toBe(false);
    });

    it('should handle missing linting section', () => {
      const reportWithoutLinting: AiReadinessReport = {
        ...sampleReport,
        checks: {
          documentation: sampleReport.checks.documentation,
          formatters: sampleReport.checks.formatters,
          sast: sampleReport.checks.sast,
          test_coverage: sampleReport.checks.test_coverage,
        },
      };

      const questResults = AiReadinessReportMapper.extractQuestResults(reportWithoutLinting);

      expect(questResults.has('linting.javascript.eslint_present')).toBe(false);
    });

    it('should handle missing sast section', () => {
      const reportWithoutSast: AiReadinessReport = {
        ...sampleReport,
        checks: {
          documentation: sampleReport.checks.documentation,
          formatters: sampleReport.checks.formatters,
          linting: sampleReport.checks.linting,
          test_coverage: sampleReport.checks.test_coverage,
        },
      };

      const questResults = AiReadinessReportMapper.extractQuestResults(reportWithoutSast);

      expect(questResults.has('sast.codeql_present')).toBe(false);
      expect(questResults.has('sast.semgrep_present')).toBe(false);
    });

    it('should handle missing test_coverage section', () => {
      const reportWithoutCoverage: AiReadinessReport = {
        ...sampleReport,
        checks: {
          documentation: sampleReport.checks.documentation,
          formatters: sampleReport.checks.formatters,
          linting: sampleReport.checks.linting,
          sast: sampleReport.checks.sast,
        },
      };

      const questResults = AiReadinessReportMapper.extractQuestResults(reportWithoutCoverage);

      expect(questResults.has('quality.coverage_available')).toBe(false);
      expect(questResults.has('quality.coverage_threshold_met')).toBe(false);
    });

    it('should return a Map with QuestKey and QuestStatus', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      expect(questResults).toBeInstanceOf(Map);
      expect(questResults.size).toBeGreaterThan(0);

      // Verify all values are QuestStatus instances
      for (const [key, value] of questResults) {
        expect(typeof key).toBe('string');
        expect(value).toBeInstanceOf(QuestStatus);
      }
    });

    it('should handle all check types in sample report', () => {
      const questResults = AiReadinessReportMapper.extractQuestResults(sampleReport);

      // Should have 8 quest results total from the sample report
      // 2 from documentation, 1 from formatters, 1 from linting, 2 from sast, 2 from test_coverage
      expect(questResults.size).toBe(8);
    });
  });
});
