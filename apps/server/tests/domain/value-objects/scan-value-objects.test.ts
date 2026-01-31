import { describe, it, expect } from 'vitest';

import {
  ScanRunId,
  CommitSha,
  QuestKey,
  QuestStatus,
} from '../../../src/domain/value-objects/scan-value-objects.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('ScanRunId', () => {
  describe('create', () => {
    it('should create a valid ScanRunId', () => {
      const id = ScanRunId.create('scan_12345');
      expect(id.value).toBe('scan_12345');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => ScanRunId.create('')).toThrow(ValidationError);
      expect(() => ScanRunId.create('')).toThrow('ScanRunId cannot be empty');
    });

    it('should trim whitespace', () => {
      const id = ScanRunId.create('  scan_123  ');
      expect(id.value).toBe('scan_123');
    });
  });
});

describe('CommitSha', () => {
  describe('create', () => {
    it('should create a valid full commit SHA (40 chars)', () => {
      const sha = CommitSha.create('7a0137597745d539fd41e88b85779eccf118afcc');
      expect(sha.value).toBe('7a0137597745d539fd41e88b85779eccf118afcc');
    });

    it('should create a valid short commit SHA (7 chars)', () => {
      const sha = CommitSha.create('7a01375');
      expect(sha.value).toBe('7a01375');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => CommitSha.create('')).toThrow(ValidationError);
      expect(() => CommitSha.create('')).toThrow('CommitSha cannot be empty');
    });

    it('should throw ValidationError for too short SHA', () => {
      expect(() => CommitSha.create('abc123')).toThrow(ValidationError);
      expect(() => CommitSha.create('abc123')).toThrow('CommitSha must be at least 7 characters');
    });

    it('should throw ValidationError for too long SHA', () => {
      const tooLong = 'a'.repeat(41);
      expect(() => CommitSha.create(tooLong)).toThrow(ValidationError);
      expect(() => CommitSha.create(tooLong)).toThrow('CommitSha must not exceed 40 characters');
    });

    it('should throw ValidationError for invalid characters', () => {
      expect(() => CommitSha.create('7a01375xyz')).toThrow(ValidationError);
      expect(() => CommitSha.create('7a01375xyz')).toThrow(
        'CommitSha must contain only hexadecimal characters',
      );
    });

    it('should accept uppercase hex characters', () => {
      const sha = CommitSha.create('7A01375');
      expect(sha.value).toBe('7A01375');
    });

    it('should trim whitespace', () => {
      const sha = CommitSha.create('  7a01375  ');
      expect(sha.value).toBe('7a01375');
    });
  });
});

describe('QuestKey', () => {
  describe('create', () => {
    it('should create a valid quest key', () => {
      const key = QuestKey.create('docs.agents_md_present');
      expect(key.value).toBe('docs.agents_md_present');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => QuestKey.create('')).toThrow(ValidationError);
      expect(() => QuestKey.create('')).toThrow('QuestKey cannot be empty');
    });

    it('should accept keys with dots and underscores', () => {
      const key = QuestKey.create('quality.coverage_threshold_met');
      expect(key.value).toBe('quality.coverage_threshold_met');
    });

    it('should trim whitespace', () => {
      const key = QuestKey.create('  docs.test  ');
      expect(key.value).toBe('docs.test');
    });
  });
});

describe('QuestStatus', () => {
  describe('create', () => {
    it('should create PASS status', () => {
      const status = QuestStatus.create('pass');
      expect(status.value).toBe('pass');
      expect(status.isPass()).toBe(true);
      expect(status.isFail()).toBe(false);
      expect(status.isUnknown()).toBe(false);
    });

    it('should create FAIL status', () => {
      const status = QuestStatus.create('fail');
      expect(status.value).toBe('fail');
      expect(status.isPass()).toBe(false);
      expect(status.isFail()).toBe(true);
      expect(status.isUnknown()).toBe(false);
    });

    it('should create UNKNOWN status', () => {
      const status = QuestStatus.create('unknown');
      expect(status.value).toBe('unknown');
      expect(status.isPass()).toBe(false);
      expect(status.isFail()).toBe(false);
      expect(status.isUnknown()).toBe(true);
    });

    it('should throw ValidationError for invalid status', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- Testing invalid input
      expect(() => QuestStatus.create('invalid' as any)).toThrow(ValidationError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- Testing invalid input
      expect(() => QuestStatus.create('invalid' as any)).toThrow(
        'QuestStatus must be one of: pass, fail, unknown',
      );
    });

    it('should be case-sensitive', () => {
      // Testing that invalid case-variants are rejected
      type InvalidStatus = 'PASS' | 'Pass';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- Testing invalid input
      expect(() => QuestStatus.create('PASS' as InvalidStatus as any)).toThrow(ValidationError);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- Testing invalid input
      expect(() => QuestStatus.create('Pass' as InvalidStatus as any)).toThrow(ValidationError);
    });
  });

  describe('static factory methods', () => {
    it('should create PASS via static method', () => {
      const status = QuestStatus.pass();
      expect(status.value).toBe('pass');
      expect(status.isPass()).toBe(true);
    });

    it('should create FAIL via static method', () => {
      const status = QuestStatus.fail();
      expect(status.value).toBe('fail');
      expect(status.isFail()).toBe(true);
    });

    it('should create UNKNOWN via static method', () => {
      const status = QuestStatus.unknown();
      expect(status.value).toBe('unknown');
      expect(status.isUnknown()).toBe(true);
    });
  });
});
