import { describe, it, expect } from 'vitest';

import { QuestStatus } from '../../../src/domain/scan-run/scan-value-objects.js';
import { toApplicationDto } from '../../../src/presentation/mappers/ingest-scan-run.mapper.js';

import type { IngestScanRequestDto } from '../../../src/presentation/dto/ingest-scan.dto.js';

describe('IngestScanRunMapper', () => {
  const sampleRequest: IngestScanRequestDto = {
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

  describe('toApplicationDto', () => {
    it('should extract repository metadata from request', () => {
      const dto = toApplicationDto(sampleRequest);

      expect(dto.metadata.fullName).toBe('ynk024/Workouttrackerdesign');
      expect(dto.metadata.url).toBe('https://github.com/ynk024/Workouttrackerdesign');
      expect(dto.metadata.commitSha).toBe('7a0137597745d539fd41e88b85779eccf118afcc');
      expect(dto.metadata.refName).toBe('main');
      expect(dto.metadata.providerRunId).toBe('21545800679');
      expect(dto.metadata.runUrl).toBe(
        'https://github.com/ynk024/Workouttrackerdesign/actions/runs/21545800679',
      );
      expect(dto.metadata.workflowVersion).toBe('1.0.0');
    });

    it('should parse owner and name from repository full name', () => {
      const dto = toApplicationDto(sampleRequest);

      expect(dto.metadata.owner).toBe('ynk024');
      expect(dto.metadata.name).toBe('Workouttrackerdesign');
    });

    it('should parse timestamp as Date object', () => {
      const dto = toApplicationDto(sampleRequest);

      expect(dto.metadata.scannedAt.toISOString()).toBe('2026-01-31T17:39:21.414Z');
    });

    it('should handle branch names with refs/heads/ prefix', () => {
      const requestWithRef: IngestScanRequestDto = {
        ...sampleRequest,
        metadata: {
          ...sampleRequest.metadata,
          repository: {
            ...sampleRequest.metadata.repository,
            branch: 'refs/heads/feature',
          },
        },
      };

      const dto = toApplicationDto(requestWithRef);

      expect(dto.metadata.refName).toBe('refs/heads/feature');
    });

    it('should throw error for invalid repository name format', () => {
      const invalidRequest: IngestScanRequestDto = {
        ...sampleRequest,
        metadata: {
          ...sampleRequest.metadata,
          repository: {
            ...sampleRequest.metadata.repository,
            name: 'invalid-name',
          },
        },
      };

      expect(() => toApplicationDto(invalidRequest)).toThrow(
        'Invalid repository name format: expected "owner/repo-name"',
      );
    });

    it('should throw error for invalid timestamp', () => {
      const invalidRequest: IngestScanRequestDto = {
        ...sampleRequest,
        metadata: { ...sampleRequest.metadata, timestamp: 'not-a-timestamp' },
      };

      expect(() => toApplicationDto(invalidRequest)).toThrow('Invalid timestamp format');
    });

    it('should extract quest results with correct status', () => {
      const dto = toApplicationDto(sampleRequest);

      expect(dto.questResults.size).toBe(8);
    });

    it('should mark documentation quests with correct pass/fail status', () => {
      const dto = toApplicationDto(sampleRequest);

      expect(dto.questResults.get('docs.agents_md_present')?.isPass()).toBe(true);
      expect(dto.questResults.get('docs.skill_md_count')?.isPass()).toBe(true);
    });

    it('should handle skill_md count of 0 as fail', () => {
      const requestWithNoSkills: IngestScanRequestDto = {
        ...sampleRequest,
        checks: {
          documentation: {
            skill_md: { count: 0 },
          },
        },
      };

      const dto = toApplicationDto(requestWithNoSkills);

      expect(dto.questResults.get('docs.skill_md_count')?.isFail()).toBe(true);
    });

    it('should mark formatter quests with correct pass/fail status', () => {
      const dto = toApplicationDto(sampleRequest);

      expect(dto.questResults.get('formatters.javascript.prettier_present')?.isPass()).toBe(true);
    });

    it('should mark linting quests with correct pass/fail status', () => {
      const dto = toApplicationDto(sampleRequest);

      expect(dto.questResults.get('linting.javascript.eslint_present')?.isPass()).toBe(true);
    });

    it('should mark sast quests with correct pass/fail status', () => {
      const dto = toApplicationDto(sampleRequest);

      expect(dto.questResults.get('sast.codeql_present')?.isPass()).toBe(true);
      expect(dto.questResults.get('sast.semgrep_present')?.isFail()).toBe(true);
    });

    it('should mark coverage quests with correct pass/fail status', () => {
      const dto = toApplicationDto(sampleRequest);

      expect(dto.questResults.get('quality.coverage_available')?.isPass()).toBe(true);
      expect(dto.questResults.get('quality.coverage_threshold_met')?.isFail()).toBe(true);
    });

    it('should omit undefined documentation quest results', () => {
      const requestWithoutDocs: IngestScanRequestDto = {
        ...sampleRequest,
        checks: {
          formatters: sampleRequest.checks.formatters,
        },
      };

      const dto = toApplicationDto(requestWithoutDocs);

      expect(dto.questResults.has('docs.agents_md_present')).toBe(false);
      expect(dto.questResults.has('docs.skill_md_count')).toBe(false);
    });

    it('should omit undefined formatter quest results', () => {
      const requestWithoutFormatters: IngestScanRequestDto = {
        ...sampleRequest,
        checks: {
          documentation: sampleRequest.checks.documentation,
        },
      };

      const dto = toApplicationDto(requestWithoutFormatters);

      expect(dto.questResults.has('formatters.javascript.prettier_present')).toBe(false);
    });

    it('should omit undefined linting quest results', () => {
      const requestWithoutLinting: IngestScanRequestDto = {
        ...sampleRequest,
        checks: {
          documentation: sampleRequest.checks.documentation,
        },
      };

      const dto = toApplicationDto(requestWithoutLinting);

      expect(dto.questResults.has('linting.javascript.eslint_present')).toBe(false);
    });

    it('should omit undefined sast quest results', () => {
      const requestWithoutSast: IngestScanRequestDto = {
        ...sampleRequest,
        checks: {
          documentation: sampleRequest.checks.documentation,
        },
      };

      const dto = toApplicationDto(requestWithoutSast);

      expect(dto.questResults.has('sast.codeql_present')).toBe(false);
      expect(dto.questResults.has('sast.semgrep_present')).toBe(false);
    });

    it('should omit undefined coverage quest results', () => {
      const requestWithoutCoverage: IngestScanRequestDto = {
        ...sampleRequest,
        checks: {
          documentation: sampleRequest.checks.documentation,
        },
      };

      const dto = toApplicationDto(requestWithoutCoverage);

      expect(dto.questResults.has('quality.coverage_available')).toBe(false);
      expect(dto.questResults.has('quality.coverage_threshold_met')).toBe(false);
    });

    it('should return QuestStatus value objects for quest results', () => {
      const dto = toApplicationDto(sampleRequest);

      const status = dto.questResults.get('docs.agents_md_present');
      expect(status).toBeInstanceOf(QuestStatus);
    });

    it('should handle all quest types in a single request', () => {
      const dto = toApplicationDto(sampleRequest);

      // Verify all expected quests are present
      expect(dto.questResults.has('docs.agents_md_present')).toBe(true);
      expect(dto.questResults.has('docs.skill_md_count')).toBe(true);
      expect(dto.questResults.has('formatters.javascript.prettier_present')).toBe(true);
      expect(dto.questResults.has('linting.javascript.eslint_present')).toBe(true);
      expect(dto.questResults.has('sast.codeql_present')).toBe(true);
      expect(dto.questResults.has('sast.semgrep_present')).toBe(true);
      expect(dto.questResults.has('quality.coverage_available')).toBe(true);
      expect(dto.questResults.has('quality.coverage_threshold_met')).toBe(true);
    });
  });
});
