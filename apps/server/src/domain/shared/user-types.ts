import { ValidationError } from '../../shared/errors/domain-errors.js';

/**
 * User identifier value object
 * Placeholder for future user system - currently accepts any non-empty string
 */
export class UserId {
  private constructor(private readonly _value: string) {}

  static create(value: string): UserId {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new ValidationError('UserId cannot be empty');
    }

    return new UserId(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
