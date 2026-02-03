import { describe, it, expect } from 'vitest';

import { QuestDetectionType } from '../../../src/domain/quest/quest-value-objects.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('QuestDetectionType', () => {
  describe('factory methods', () => {
    it('should create auto-only detection type', () => {
      const detectionType = QuestDetectionType.autoOnly();
      expect(detectionType.value).toBe('auto-only');
    });

    it('should create manual-only detection type', () => {
      const detectionType = QuestDetectionType.manualOnly();
      expect(detectionType.value).toBe('manual-only');
    });

    it('should create both detection type', () => {
      const detectionType = QuestDetectionType.both();
      expect(detectionType.value).toBe('both');
    });
  });

  describe('create from string', () => {
    it('should create auto-only from string', () => {
      const detectionType = QuestDetectionType.create('auto-only');
      expect(detectionType.value).toBe('auto-only');
    });

    it('should create manual-only from string', () => {
      const detectionType = QuestDetectionType.create('manual-only');
      expect(detectionType.value).toBe('manual-only');
    });

    it('should create both from string', () => {
      const detectionType = QuestDetectionType.create('both');
      expect(detectionType.value).toBe('both');
    });

    it('should throw ValidationError for invalid value', () => {
      expect(() => QuestDetectionType.create('invalid')).toThrow(ValidationError);
      expect(() => QuestDetectionType.create('invalid')).toThrow(
        'QuestDetectionType must be one of: auto-only, manual-only, both',
      );
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => QuestDetectionType.create('')).toThrow(ValidationError);
    });
  });

  describe('canAutoDetect', () => {
    it('should return true for auto-only', () => {
      const detectionType = QuestDetectionType.autoOnly();
      expect(detectionType.canAutoDetect()).toBe(true);
    });

    it('should return false for manual-only', () => {
      const detectionType = QuestDetectionType.manualOnly();
      expect(detectionType.canAutoDetect()).toBe(false);
    });

    it('should return true for both', () => {
      const detectionType = QuestDetectionType.both();
      expect(detectionType.canAutoDetect()).toBe(true);
    });
  });

  describe('canManuallyApprove', () => {
    it('should return false for auto-only', () => {
      const detectionType = QuestDetectionType.autoOnly();
      expect(detectionType.canManuallyApprove()).toBe(false);
    });

    it('should return true for manual-only', () => {
      const detectionType = QuestDetectionType.manualOnly();
      expect(detectionType.canManuallyApprove()).toBe(true);
    });

    it('should return true for both', () => {
      const detectionType = QuestDetectionType.both();
      expect(detectionType.canManuallyApprove()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for same type', () => {
      const type1 = QuestDetectionType.autoOnly();
      const type2 = QuestDetectionType.autoOnly();
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different types', () => {
      const type1 = QuestDetectionType.autoOnly();
      const type2 = QuestDetectionType.manualOnly();
      expect(type1.equals(type2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the string value', () => {
      const detectionType = QuestDetectionType.both();
      expect(detectionType.toString()).toBe('both');
    });
  });
});
