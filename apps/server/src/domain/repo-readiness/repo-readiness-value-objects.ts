import { ValidationError } from '../../shared/errors/domain-errors.js';
import { UserId } from '../shared/user-types.js';

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
 * Completion source for a quest
 */
export type CompletionSource = 'automatic' | 'manual';

/**
 * Manual approval metadata for a quest
 */
export interface ManualApprovalMetadata {
  readonly approvedBy: UserId;
  readonly approvedAt: Date;
  readonly revokedAt?: Date; // For audit trail
}

/**
 * Readiness information for a single quest
 */
export interface QuestReadinessEntry {
  readonly status: ReadinessStatus;
  readonly level: number;
  readonly lastSeenAt: Date;
  readonly completionSource: CompletionSource;
  readonly manualApproval?: ManualApprovalMetadata;
}

/**
 * Factory for creating QuestReadinessEntry
 */
// eslint-disable-next-line max-params -- Factory function requires all parameters for clarity
export function createQuestReadinessEntry(
  status: ReadinessStatus,
  level: number,
  lastSeenAt: Date,
  completionSource: CompletionSource,
  manualApproval?: ManualApprovalMetadata,
): QuestReadinessEntry {
  if (level < 1) {
    throw new ValidationError('Quest level must be at least 1');
  }

  if (completionSource === 'manual' && !manualApproval) {
    throw new ValidationError('Manual approval metadata is required for manual completion source');
  }

  if (completionSource === 'automatic' && manualApproval) {
    throw new ValidationError('Automatic completion source cannot have manual approval metadata');
  }

  return {
    status,
    level,
    lastSeenAt,
    completionSource,
    manualApproval,
  };
}
