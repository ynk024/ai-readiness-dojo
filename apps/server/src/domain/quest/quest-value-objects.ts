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

/**
 * Quest detection type value object
 * Defines how a quest can be completed: automatically detected, manually approved, or both
 */
export type QuestDetectionTypeValue = 'auto-only' | 'manual-only' | 'both';

const DETECTION_TYPE_AUTO_ONLY = 'auto-only';
const DETECTION_TYPE_MANUAL_ONLY = 'manual-only';
const DETECTION_TYPE_BOTH = 'both';
const DETECTION_TYPE_ERROR_MSG = 'QuestDetectionType must be one of: auto-only, manual-only, both';

export class QuestDetectionType {
  private constructor(private readonly _value: QuestDetectionTypeValue) {}

  static create(value: string): QuestDetectionType {
    if (
      value !== DETECTION_TYPE_AUTO_ONLY &&
      value !== DETECTION_TYPE_MANUAL_ONLY &&
      value !== DETECTION_TYPE_BOTH
    ) {
      throw new ValidationError(DETECTION_TYPE_ERROR_MSG);
    }

    return new QuestDetectionType(value);
  }

  static autoOnly(): QuestDetectionType {
    return new QuestDetectionType(DETECTION_TYPE_AUTO_ONLY);
  }

  static manualOnly(): QuestDetectionType {
    return new QuestDetectionType(DETECTION_TYPE_MANUAL_ONLY);
  }

  static both(): QuestDetectionType {
    return new QuestDetectionType(DETECTION_TYPE_BOTH);
  }

  get value(): QuestDetectionTypeValue {
    return this._value;
  }

  canAutoDetect(): boolean {
    return this._value === DETECTION_TYPE_AUTO_ONLY || this._value === DETECTION_TYPE_BOTH;
  }

  canManuallyApprove(): boolean {
    return this._value === DETECTION_TYPE_MANUAL_ONLY || this._value === DETECTION_TYPE_BOTH;
  }

  equals(other: QuestDetectionType): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
