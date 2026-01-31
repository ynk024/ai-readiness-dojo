import { ValidationError } from '../../shared/errors/domain-errors.js';

// Validation constants
const MAX_ITEM_ID_LENGTH = 100;
const MIN_ITEM_NAME_LENGTH = 2;
const MAX_ITEM_NAME_LENGTH = 200;

/**
 * ItemId Value Object
 *
 * Represents a unique identifier for an Item entity.
 * Value objects are immutable and enforce validation rules.
 */
export class ItemId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Creates an ItemId from a string value
   * @param value The identifier value
   * @throws {ValidationError} If the value is invalid
   */
  static create(value: string): ItemId {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('ItemId cannot be empty');
    }

    if (value.length > MAX_ITEM_ID_LENGTH) {
      throw new ValidationError(`ItemId cannot exceed ${MAX_ITEM_ID_LENGTH} characters`);
    }

    return new ItemId(value.trim());
  }

  get value(): string {
    return this._value;
  }

  equals(other: ItemId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

/**
 * ItemName Value Object
 *
 * Represents the name of an Item with business rules.
 */
export class ItemName {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Creates an ItemName from a string value
   * @param value The name value
   * @throws {ValidationError} If the value is invalid
   */
  static create(value: string): ItemName {
    if (!value || value.trim().length === 0) {
      throw new ValidationError('ItemName cannot be empty');
    }

    if (value.trim().length < MIN_ITEM_NAME_LENGTH) {
      throw new ValidationError(`ItemName must be at least ${MIN_ITEM_NAME_LENGTH} characters`);
    }

    if (value.length > MAX_ITEM_NAME_LENGTH) {
      throw new ValidationError(`ItemName cannot exceed ${MAX_ITEM_NAME_LENGTH} characters`);
    }

    return new ItemName(value.trim());
  }

  get value(): string {
    return this._value;
  }

  equals(other: ItemName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
