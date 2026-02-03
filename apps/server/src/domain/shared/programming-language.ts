import { ValidationError } from '../../shared/errors/domain-errors.js';

/**
 * Supported programming languages for AI readiness tracking
 */
type SupportedLanguage = 'javascript' | 'typescript' | 'java';

const SUPPORTED_LANGUAGES: ReadonlySet<string> = new Set<SupportedLanguage>([
  'javascript',
  'typescript',
  'java',
]);

/**
 * Programming Language Value Object
 *
 * Represents a programming language in the domain model.
 * Ensures only supported languages are used throughout the system.
 */
export class ProgrammingLanguage {
  private readonly _value: SupportedLanguage;

  private constructor(value: SupportedLanguage) {
    this._value = value;
  }

  /**
   * Create a ProgrammingLanguage from a string value
   * @param value - The language string (must be one of: javascript, typescript, java)
   * @returns ProgrammingLanguage instance
   * @throws ValidationError if the language is not supported
   */
  static create(value: string): ProgrammingLanguage {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new ValidationError(
        `Invalid programming language: empty string. Supported languages: ${Array.from(SUPPORTED_LANGUAGES).join(', ')}`,
      );
    }

    if (!SUPPORTED_LANGUAGES.has(trimmed)) {
      throw new ValidationError(
        `Invalid programming language: ${trimmed}. Supported languages: ${Array.from(SUPPORTED_LANGUAGES).join(', ')}`,
      );
    }

    return new ProgrammingLanguage(trimmed as SupportedLanguage);
  }

  /**
   * Create a ProgrammingLanguage from a nullable string
   * Returns null for null/undefined values
   * Throws ValidationError for invalid/unsupported languages
   *
   * @param value - The language string or null/undefined
   * @returns ProgrammingLanguage instance or null
   * @throws ValidationError if the language is not supported
   */
  static fromString(value: string | null | undefined): ProgrammingLanguage | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new ValidationError(
        `Invalid programming language: empty string. Supported languages: ${Array.from(SUPPORTED_LANGUAGES).join(', ')}`,
      );
    }

    if (!SUPPORTED_LANGUAGES.has(trimmed)) {
      throw new ValidationError(
        `Invalid programming language: ${trimmed}. Supported languages: ${Array.from(SUPPORTED_LANGUAGES).join(', ')}`,
      );
    }

    return new ProgrammingLanguage(trimmed as SupportedLanguage);
  }

  /**
   * Get the language value
   */
  get value(): string {
    return this._value;
  }

  /**
   * Compare equality with another ProgrammingLanguage
   * @param other - Another ProgrammingLanguage instance
   * @returns true if languages are equal
   */
  equals(other: ProgrammingLanguage): boolean {
    return this._value === other._value;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return this._value;
  }
}
