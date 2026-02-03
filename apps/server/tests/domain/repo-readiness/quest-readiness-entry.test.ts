import { describe, it, expect } from 'vitest';

import {
  createQuestReadinessEntry,
  ReadinessStatus,
} from '../../../src/domain/repo-readiness/repo-readiness-value-objects.js';
import { UserId } from '../../../src/domain/shared/user-types.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('QuestReadinessEntry', () => {
  describe('createQuestReadinessEntry - automatic detection', () => {
    it('should create entry for automatic detection', () => {
      const entry = createQuestReadinessEntry(
        ReadinessStatus.complete(),
        1,
        new Date(),
        'automatic',
      );

      expect(entry.status.isComplete()).toBe(true);
      expect(entry.level).toBe(1);
      expect(entry.completionSource).toBe('automatic');
      expect(entry.manualApproval).toBeUndefined();
    });

    it('should throw error for level less than 1', () => {
      expect(() =>
        createQuestReadinessEntry(ReadinessStatus.complete(), 0, new Date(), 'automatic'),
      ).toThrow(ValidationError);
      expect(() =>
        createQuestReadinessEntry(ReadinessStatus.complete(), 0, new Date(), 'automatic'),
      ).toThrow('Quest level must be at least 1');
    });
  });

  describe('createQuestReadinessEntry - manual approval', () => {
    it('should create entry for manual approval with metadata', () => {
      const approvedBy = UserId.create('user_123');
      const approvedAt = new Date();
      const entry = createQuestReadinessEntry(ReadinessStatus.complete(), 2, approvedAt, 'manual', {
        approvedBy,
        approvedAt,
      });

      expect(entry.status.isComplete()).toBe(true);
      expect(entry.level).toBe(2);
      expect(entry.completionSource).toBe('manual');
      expect(entry.manualApproval).toBeDefined();
      expect(entry.manualApproval?.approvedBy.equals(approvedBy)).toBe(true);
      expect(entry.manualApproval?.approvedAt).toBe(approvedAt);
      expect(entry.manualApproval?.revokedAt).toBeUndefined();
    });

    it('should throw error if manual completion source lacks approval metadata', () => {
      expect(() =>
        createQuestReadinessEntry(ReadinessStatus.complete(), 1, new Date(), 'manual'),
      ).toThrow(ValidationError);
      expect(() =>
        createQuestReadinessEntry(ReadinessStatus.complete(), 1, new Date(), 'manual'),
      ).toThrow('Manual approval metadata is required for manual completion source');
    });

    it('should create entry with revocation metadata', () => {
      const approvedBy = UserId.create('user_123');
      const approvedAt = new Date('2024-01-01');
      const revokedAt = new Date('2024-01-02');
      const entry = createQuestReadinessEntry(ReadinessStatus.complete(), 1, approvedAt, 'manual', {
        approvedBy,
        approvedAt,
        revokedAt,
      });

      expect(entry.manualApproval?.revokedAt).toBe(revokedAt);
    });
  });

  describe('createQuestReadinessEntry - validation', () => {
    it('should reject automatic completion with manual approval metadata', () => {
      const approvedBy = UserId.create('user_123');
      const approvedAt = new Date();

      expect(() =>
        createQuestReadinessEntry(ReadinessStatus.complete(), 1, new Date(), 'automatic', {
          approvedBy,
          approvedAt,
        }),
      ).toThrow(ValidationError);
      expect(() =>
        createQuestReadinessEntry(ReadinessStatus.complete(), 1, new Date(), 'automatic', {
          approvedBy,
          approvedAt,
        }),
      ).toThrow('Automatic completion source cannot have manual approval metadata');
    });
  });
});
