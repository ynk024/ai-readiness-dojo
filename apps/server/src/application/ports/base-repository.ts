/**
 * Base Repository Interface - Outbound Port
 *
 * This interface defines the contract for all repository implementations.
 * It follows the Repository pattern from Domain-Driven Design and serves
 * as an outbound port in hexagonal architecture.
 *
 * The application layer defines this interface as an outbound port, and the
 * infrastructure layer provides concrete implementations (adapters) for specific
 * persistence technologies (e.g., Firestore, MongoDB, PostgreSQL).
 *
 * @template T The domain entity type
 * @template ID The identifier type (e.g., string, number)
 */
export interface BaseRepository<T, ID> {
  /**
   * Finds an entity by its unique identifier
   * @param id The entity identifier
   * @returns The entity if found, null otherwise
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Retrieves all entities from the repository
   * @returns An array of all entities
   */
  findAll(): Promise<T[]>;

  /**
   * Persists a new entity or updates an existing one
   * @param entity The entity to save
   * @returns The saved entity with any generated fields (e.g., timestamps)
   */
  save(entity: T): Promise<T>;

  /**
   * Updates specific fields of an entity
   * @param id The entity identifier
   * @param partial Partial entity data to update
   * @returns The updated entity
   * @throws {Error} If the entity is not found
   */
  update(id: ID, partial: Partial<T>): Promise<T>;

  /**
   * Removes an entity from the repository
   * @param id The entity identifier
   * @throws {Error} If the entity is not found
   */
  delete(id: ID): Promise<void>;

  /**
   * Checks if an entity exists by its identifier
   * @param id The entity identifier
   * @returns True if the entity exists, false otherwise
   */
  exists(id: ID): Promise<boolean>;
}
