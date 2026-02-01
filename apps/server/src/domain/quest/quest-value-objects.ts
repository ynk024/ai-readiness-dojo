import { ValidationError } from '../../shared/errors/domain-errors.js';

export class QuestId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): QuestId {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new ValidationError('QuestId cannot be empty');
    }

    return new QuestId(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: QuestId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
