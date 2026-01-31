/**
 * Domain Errors
 *
 * Custom error types for domain layer exceptions.
 * These errors are independent of any infrastructure concerns.
 */

/**
 * Base class for all domain errors
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when an entity is not found in the repository
 */
export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string | number) {
    super(`${entityName} with id '${id}' not found`);
  }
}

/**
 * Thrown when attempting to create an entity that already exists
 */
export class EntityAlreadyExistsError extends DomainError {
  constructor(entityName: string, id: string | number) {
    super(`${entityName} with id '${id}' already exists`);
  }
}

/**
 * Thrown when entity validation fails
 */
export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

/**
 * Thrown when a business rule is violated
 */
export class BusinessRuleViolationError extends DomainError {}
