import { ValidationError } from '../../shared/errors/domain-errors.js';

/**
 * Readiness status for a single quest
 */
type ReadinessStatusValue = 'complete' | 'incomplete' | 'unknown';

export class ReadinessStatus {
  private readonly _value: ReadinessStatusValue;

  private constructor(value: ReadinessStatusValue) {
    this._value = value;
  }

  static create(value: string): ReadinessStatus {
    if (value !== 'complete' && value !== 'incomplete' && value !== 'unknown') {
      throw new ValidationError('ReadinessStatus must be one of: complete, incomplete, unknown');
    }

    return new ReadinessStatus(value);
  }

  static complete(): ReadinessStatus {
    return new ReadinessStatus('complete');
  }

  static incomplete(): ReadinessStatus {
    return new ReadinessStatus('incomplete');
  }

  static unknown(): ReadinessStatus {
    return new ReadinessStatus('unknown');
  }

  get value(): ReadinessStatusValue {
    return this._value;
  }

  isComplete(): boolean {
    return this._value === 'complete';
  }

  isIncomplete(): boolean {
    return this._value === 'incomplete';
  }

  isUnknown(): boolean {
    return this._value === 'unknown';
  }

  equals(other: ReadinessStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * Readiness information for a single quest
 */
export interface QuestReadinessEntry {
  readonly status: ReadinessStatus;
  readonly level: number;
  readonly lastSeenAt: Date;
}

/**
 * Factory for creating QuestReadinessEntry
 */
export function createQuestReadinessEntry(
  status: ReadinessStatus,
  level: number,
  lastSeenAt: Date,
): QuestReadinessEntry {
  if (level < 1) {
    throw new ValidationError('Quest level must be at least 1');
  }

  return {
    status,
    level,
    lastSeenAt,
  };
}
