import { describe, it, expect } from 'vitest';

import { QuestId } from '../../../src/domain/quest/quest-value-objects.js';

describe('QuestId', () => {
  describe('create', () => {
    it('should create a QuestId with valid value', () => {
      const id = QuestId.create('quest_123');

      expect(id.value).toBe('quest_123');
    });

    it('should trim whitespace from value', () => {
      const id = QuestId.create('  quest_456  ');

      expect(id.value).toBe('quest_456');
    });

    it('should throw ValidationError when value is empty', () => {
      expect(() => QuestId.create('')).toThrow('QuestId cannot be empty');
    });

    it('should throw ValidationError when value is only whitespace', () => {
      expect(() => QuestId.create('   ')).toThrow('QuestId cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for identical values', () => {
      const id1 = QuestId.create('quest_123');
      const id2 = QuestId.create('quest_123');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different values', () => {
      const id1 = QuestId.create('quest_123');
      const id2 = QuestId.create('quest_456');

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the string value', () => {
      const id = QuestId.create('quest_789');

      expect(id.toString()).toBe('quest_789');
    });
  });
});
