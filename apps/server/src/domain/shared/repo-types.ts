import { ValidationError } from '../../shared/errors/domain-errors.js';

export class RepoId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): RepoId {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new ValidationError('RepoId cannot be empty');
    }

    return new RepoId(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: RepoId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

export class RepoFullName {
  private readonly _value: string;
  private readonly _owner: string;
  private readonly _name: string;

  private constructor(value: string, owner: string, name: string) {
    this._value = value;
    this._owner = owner;
    this._name = name;
  }

  static create(value: string): RepoFullName {
    const trimmed = value.trim();
    const EXPECTED_PARTS = 2;

    if (trimmed.length === 0) {
      throw new ValidationError('RepoFullName cannot be empty');
    }

    const parts = trimmed.split('/');
    if (parts.length !== EXPECTED_PARTS) {
      throw new ValidationError('RepoFullName must be in format "owner/name"');
    }

    const owner = parts[0];
    const name = parts[1];

    if (!owner || owner.length === 0 || !name || name.length === 0) {
      throw new ValidationError('RepoFullName owner and name cannot be empty');
    }

    return new RepoFullName(trimmed, owner, name);
  }

  get value(): string {
    return this._value;
  }

  get owner(): string {
    return this._owner;
  }

  get name(): string {
    return this._name;
  }

  equals(other: RepoFullName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

export class RepoUrl {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): RepoUrl {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new ValidationError('RepoUrl cannot be empty');
    }

    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      throw new ValidationError('RepoUrl must be a valid URL');
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new ValidationError('RepoUrl must use http or https protocol');
    }

    return new RepoUrl(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: RepoUrl): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
