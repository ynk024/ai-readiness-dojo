import { describe, it, expect } from 'vitest';

import { TeamId, TeamSlug } from '../../../src/domain/shared/team-types.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('TeamId', () => {
  describe('create', () => {
    it('should create a valid TeamId', () => {
      const teamId = TeamId.create('team_engineering');
      expect(teamId.value).toBe('team_engineering');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => TeamId.create('')).toThrow(ValidationError);
      expect(() => TeamId.create('')).toThrow('TeamId cannot be empty');
    });

    it('should throw ValidationError for whitespace-only string', () => {
      expect(() => TeamId.create('   ')).toThrow(ValidationError);
      expect(() => TeamId.create('   ')).toThrow('TeamId cannot be empty');
    });

    it('should trim whitespace', () => {
      const teamId = TeamId.create('  team_eng  ');
      expect(teamId.value).toBe('team_eng');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const id1 = TeamId.create('team_eng');
      const id2 = TeamId.create('team_eng');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different values', () => {
      const id1 = TeamId.create('team_eng');
      const id2 = TeamId.create('team_product');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const id1 = TeamId.create('team_eng');
      const id2 = TeamId.create('team_ENG');
      expect(id1.equals(id2)).toBe(false);
    });
  });
});

describe('TeamSlug', () => {
  describe('create', () => {
    it('should create a valid slug', () => {
      const slug = TeamSlug.create('engineering-team');
      expect(slug.value).toBe('engineering-team');
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => TeamSlug.create('')).toThrow(ValidationError);
      expect(() => TeamSlug.create('')).toThrow('TeamSlug cannot be empty');
    });

    it('should throw ValidationError for invalid characters', () => {
      expect(() => TeamSlug.create('team with spaces')).toThrow(ValidationError);
      expect(() => TeamSlug.create('team with spaces')).toThrow(
        'TeamSlug must contain only lowercase letters, numbers, and hyphens',
      );
    });

    it('should throw ValidationError for uppercase letters', () => {
      expect(() => TeamSlug.create('TeamName')).toThrow(ValidationError);
    });

    it('should throw ValidationError for special characters', () => {
      expect(() => TeamSlug.create('team_name')).toThrow(ValidationError);
      expect(() => TeamSlug.create('team@name')).toThrow(ValidationError);
      expect(() => TeamSlug.create('team.name')).toThrow(ValidationError);
    });

    it('should throw ValidationError for slug that is too long', () => {
      const longSlug = 'a'.repeat(101);
      expect(() => TeamSlug.create(longSlug)).toThrow(ValidationError);
      expect(() => TeamSlug.create(longSlug)).toThrow(
        'TeamSlug must be between 1 and 100 characters',
      );
    });

    it('should accept valid slug with numbers and hyphens', () => {
      const slug = TeamSlug.create('team-123-alpha');
      expect(slug.value).toBe('team-123-alpha');
    });

    it('should trim whitespace', () => {
      const slug = TeamSlug.create('  engineering-team  ');
      expect(slug.value).toBe('engineering-team');
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const slug1 = TeamSlug.create('engineering');
      const slug2 = TeamSlug.create('engineering');
      expect(slug1.equals(slug2)).toBe(true);
    });

    it('should return false for different values', () => {
      const slug1 = TeamSlug.create('engineering');
      const slug2 = TeamSlug.create('product');
      expect(slug1.equals(slug2)).toBe(false);
    });
  });
});
