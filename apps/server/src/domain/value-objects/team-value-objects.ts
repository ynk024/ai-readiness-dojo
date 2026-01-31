import { ValidationError } from '../../shared/errors/domain-errors.js';

export class TeamId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): TeamId {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new ValidationError('TeamId cannot be empty');
    }

    return new TeamId(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: TeamId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

export class TeamSlug {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): TeamSlug {
    const trimmed = value.trim();
    const MAX_SLUG_LENGTH = 100;

    if (trimmed.length === 0) {
      throw new ValidationError('TeamSlug cannot be empty');
    }

    if (trimmed.length > MAX_SLUG_LENGTH) {
      throw new ValidationError('TeamSlug must be between 1 and 100 characters');
    }

    // Only lowercase letters, numbers, and hyphens
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(trimmed)) {
      throw new ValidationError(
        'TeamSlug must contain only lowercase letters, numbers, and hyphens',
      );
    }

    return new TeamSlug(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: TeamSlug): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
