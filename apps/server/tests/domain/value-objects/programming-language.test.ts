import { describe, it, expect } from 'vitest';

import { ProgrammingLanguage } from '../../../src/domain/shared/programming-language.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('ProgrammingLanguage Value Object', () => {
  describe('create', () => {
    it('should create a valid JavaScript language', () => {
      const language = ProgrammingLanguage.create('javascript');

      expect(language.value).toBe('javascript');
      expect(language.toString()).toBe('javascript');
    });

    it('should create a valid TypeScript language', () => {
      const language = ProgrammingLanguage.create('typescript');

      expect(language.value).toBe('typescript');
      expect(language.toString()).toBe('typescript');
    });

    it('should create a valid Java language', () => {
      const language = ProgrammingLanguage.create('java');

      expect(language.value).toBe('java');
      expect(language.toString()).toBe('java');
    });

    it('should throw ValidationError for invalid language', () => {
      expect(() => {
        ProgrammingLanguage.create('python');
      }).toThrow(ValidationError);
      expect(() => {
        ProgrammingLanguage.create('python');
      }).toThrow(
        'Invalid programming language: python. Supported languages: javascript, typescript, java',
      );
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => {
        ProgrammingLanguage.create('');
      }).toThrow(ValidationError);
      expect(() => {
        ProgrammingLanguage.create('');
      }).toThrow('Invalid programming language');
    });

    it('should throw ValidationError for whitespace-only string', () => {
      expect(() => {
        ProgrammingLanguage.create('   ');
      }).toThrow(ValidationError);
    });

    it('should be case-sensitive (uppercase should fail)', () => {
      expect(() => {
        ProgrammingLanguage.create('JavaScript');
      }).toThrow(ValidationError);
    });

    it('should be case-sensitive (mixed case should fail)', () => {
      expect(() => {
        ProgrammingLanguage.create('TypeScript');
      }).toThrow(ValidationError);
    });
  });

  describe('fromString', () => {
    it('should create ProgrammingLanguage from valid string', () => {
      const language = ProgrammingLanguage.fromString('javascript');

      expect(language).not.toBeNull();
      expect(language?.value).toBe('javascript');
    });

    it('should return null for null input', () => {
      const language = ProgrammingLanguage.fromString(null);

      expect(language).toBeNull();
    });

    it('should return null for undefined input', () => {
      const language = ProgrammingLanguage.fromString(undefined);

      expect(language).toBeNull();
    });

    it('should throw ValidationError for invalid language', () => {
      expect(() => {
        ProgrammingLanguage.fromString('python');
      }).toThrow(ValidationError);
      expect(() => {
        ProgrammingLanguage.fromString('python');
      }).toThrow(
        'Invalid programming language: python. Supported languages: javascript, typescript, java',
      );
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => {
        ProgrammingLanguage.fromString('');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for whitespace-only string', () => {
      expect(() => {
        ProgrammingLanguage.fromString('   ');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for uppercase (case-sensitive)', () => {
      expect(() => {
        ProgrammingLanguage.fromString('JavaScript');
      }).toThrow(ValidationError);
    });
  });

  describe('equals', () => {
    it('should return true for same language', () => {
      const lang1 = ProgrammingLanguage.create('javascript');
      const lang2 = ProgrammingLanguage.create('javascript');

      expect(lang1.equals(lang2)).toBe(true);
    });

    it('should return false for different languages', () => {
      const lang1 = ProgrammingLanguage.create('javascript');
      const lang2 = ProgrammingLanguage.create('typescript');

      expect(lang1.equals(lang2)).toBe(false);
    });

    it('should return true when comparing with itself', () => {
      const lang = ProgrammingLanguage.create('java');

      expect(lang.equals(lang)).toBe(true);
    });
  });
});
