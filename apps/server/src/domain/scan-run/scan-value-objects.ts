import { ValidationError } from '../../shared/errors/domain-errors.js';

export class ScanRunId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): ScanRunId {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new ValidationError('ScanRunId cannot be empty');
    }

    return new ScanRunId(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ScanRunId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

export class CommitSha {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): CommitSha {
    const trimmed = value.trim();
    const MIN_SHA_LENGTH = 7;
    const MAX_SHA_LENGTH = 40;

    if (trimmed.length === 0) {
      throw new ValidationError('CommitSha cannot be empty');
    }

    if (trimmed.length < MIN_SHA_LENGTH) {
      throw new ValidationError('CommitSha must be at least 7 characters');
    }

    if (trimmed.length > MAX_SHA_LENGTH) {
      throw new ValidationError('CommitSha must not exceed 40 characters');
    }

    const hexPattern = /^[0-9a-fA-F]+$/;
    if (!hexPattern.test(trimmed)) {
      throw new ValidationError('CommitSha must contain only hexadecimal characters');
    }

    return new CommitSha(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: CommitSha): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

export class QuestKey {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): QuestKey {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new ValidationError('QuestKey cannot be empty');
    }

    return new QuestKey(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: QuestKey): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

export class ScanResult {
  private readonly _data: Record<string, unknown>;

  private constructor(data: Record<string, unknown>) {
    this._data = data;
  }

  static create(data: Record<string, unknown>): ScanResult {
    return new ScanResult(data);
  }

  get data(): Record<string, unknown> {
    return { ...this._data };
  }

  equals(other: ScanResult): boolean {
    return JSON.stringify(this._data) === JSON.stringify(other._data);
  }
}
