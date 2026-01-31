import { Item } from '../entities/item.js';
import { ItemId } from '../value-objects/item-value-objects.js';

import { BaseRepository } from './base-repository.js';

/**
 * Item Repository Interface - Outbound Port
 *
 * Extends the base repository with Item-specific query methods.
 * This interface is defined in the domain layer and implemented
 * by infrastructure adapters (e.g., FirestoreItemRepository).
 */
export interface ItemRepository extends BaseRepository<Item, ItemId> {
  /**
   * Finds items by name (partial match)
   * @param nameFragment Part of the item name to search for
   * @returns Array of matching items
   */
  findByName(nameFragment: string): Promise<Item[]>;

  /**
   * Finds items with quantity below a threshold
   * @param threshold The quantity threshold
   * @returns Array of items with low stock
   */
  findLowStock(threshold: number): Promise<Item[]>;

  /**
   * Finds items created within a date range
   * @param startDate Start of the date range
   * @param endDate End of the date range
   * @returns Array of items created in the range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Item[]>;
}
