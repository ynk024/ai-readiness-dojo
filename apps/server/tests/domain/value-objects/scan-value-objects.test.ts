import { describe, it, expect } from 'vitest';

import {
  ScanRunId,
  CommitSha,
  QuestKey,
  ScanResult,
} from '../../../src/domain/scan-run/scan-value-objects.js';
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

describe('ScanResult', () => {
  describe('create', () => {
    it('should create a ScanResult with data', () => {
      const data = { present: true, count: 5 };
      const result = ScanResult.create(data);
      expect(result.data).toEqual(data);
    });

    it('should be immutable', () => {
      const data = { count: 1 };
      const result = ScanResult.create(data);
      // Modify the returned data object
      result.data.count = 2;
      // Original data should not be changed
      expect(result.data.count).toBe(1);
    });

    it('should check equality correctly', () => {
      const r1 = ScanResult.create({ a: 1 });
      const r2 = ScanResult.create({ a: 1 });
      const r3 = ScanResult.create({ a: 2 });

      expect(r1.equals(r2)).toBe(true);
      expect(r1.equals(r3)).toBe(false);
    });
  });
});
