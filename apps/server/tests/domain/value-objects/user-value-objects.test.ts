import { describe, it, expect } from 'vitest';

import { UserId } from '../../../src/domain/shared/user-types.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('UserId', () => {
  describe('create', () => {
    it('should create a valid UserId', () => {
      const userId = UserId.create('user_123');
      expect(userId.value).toBe('user_123');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => UserId.create('')).toThrow(ValidationError);
      expect(() => UserId.create('')).toThrow('UserId cannot be empty');
    });

    it('should throw ValidationError for whitespace-only string', () => {
      expect(() => UserId.create('   ')).toThrow(ValidationError);
      expect(() => UserId.create('   ')).toThrow('UserId cannot be empty');
    });

    it('should trim whitespace', () => {
      const userId = UserId.create('  user_456  ');
      expect(userId.value).toBe('user_456');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const id1 = UserId.create('user_123');
      const id2 = UserId.create('user_123');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different values', () => {
      const id1 = UserId.create('user_123');
      const id2 = UserId.create('user_456');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const id1 = UserId.create('user_abc');
      const id2 = UserId.create('user_ABC');
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the string value', () => {
      const userId = UserId.create('user_789');
      expect(userId.toString()).toBe('user_789');
    });
  });
});
