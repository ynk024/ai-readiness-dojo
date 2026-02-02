import { describe, expect, it } from 'vitest';

import { IngestScanRequestDto } from '../dto/ingest-scan.dto.js';

import { toApplicationDto } from './ingest-scan-run.mapper.js';

describe('IngestScanRunMapper', () => {
  const baseRequest: IngestScanRequestDto = {
    metadata: {
      repository: {
        name: 'owner/repo',
        url: 'https://github.com/owner/repo',
        commit_sha: 'sha123',
        branch: 'main',
        run_id: 'run123',
        run_url: 'https://github.com/owner/repo/actions/runs/123',
      },
      timestamp: new Date().toISOString(),
      workflow_version: '1.0.0',
    },
    checks: {},
  };

  it('should extract skill count from documentation check', () => {
    const request: IngestScanRequestDto = {
      ...baseRequest,
      checks: {
        documentation: {
          skill_md: { count: 3 },
        },
      },
    };

    const result = toApplicationDto(request);
    const skillResult = result.questResults.get('docs.skill_md_count');

    expect(skillResult).toBeDefined();
    // Unopinionated data extraction
    expect(skillResult?.data).toEqual({ count: 3 });
  });

  it('should extract zero skill count correctly', () => {
    const request: IngestScanRequestDto = {
      ...baseRequest,
      checks: {
        documentation: {
          skill_md: { count: 0 },
        },
      },
    };

    const result = toApplicationDto(request);
    const skillResult = result.questResults.get('docs.skill_md_count');

    expect(skillResult).toBeDefined();
    expect(skillResult?.data).toEqual({ count: 0 });
  });

  it('should extract coverage score', () => {
    const request: IngestScanRequestDto = {
      ...baseRequest,
      checks: {
        test_coverage: {
          available: true,
          meets_threshold: true,
          coverage: {
            lines: { percentage: 85.5 },
          },
        },
      },
    };

    const result = toApplicationDto(request);
    const coverageResult = result.questResults.get('quality.coverage_threshold_met');

    expect(coverageResult).toBeDefined();
    // Includes score and threshold flag
    expect(coverageResult?.data).toEqual({
      meets_threshold: true,
      score: 85.5,
    });
  });

  it('should extract coverage score even if failed in report', () => {
    const request: IngestScanRequestDto = {
      ...baseRequest,
      checks: {
        test_coverage: {
          available: true,
          meets_threshold: false,
          coverage: {
            lines: { percentage: 40.0 },
          },
        },
      },
    };

    const result = toApplicationDto(request);
    const coverageResult = result.questResults.get('quality.coverage_threshold_met');

    expect(coverageResult).toBeDefined();
    // Just extracts data, doesn't decide pass/fail
    expect(coverageResult?.data).toEqual({
      meets_threshold: false,
      score: 40.0,
    });
  });

  it('should extract presence flags', () => {
    const request: IngestScanRequestDto = {
      ...baseRequest,
      checks: {
        documentation: {
          agents_md: { present: true },
        },
        formatters: {
          javascript: {
            prettier: { present: false },
          },
        },
      },
    };

    const result = toApplicationDto(request);

    const agentsResult = result.questResults.get('docs.agents_md_present');
    expect(agentsResult?.data).toEqual({ present: true });

    const prettierResult = result.questResults.get('formatters.javascript.prettier_present');
    expect(prettierResult?.data).toEqual({ present: false });
  });
});
