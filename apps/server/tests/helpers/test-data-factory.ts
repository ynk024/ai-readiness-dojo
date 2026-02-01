import { ItemId, ItemName } from '../../src/domain/item/item-value-objects.js';
import { Item } from '../../src/domain/item/item.js';

/**
 * Test Data Factory
 *
 * Provides factory functions to create test data for Item entities.
 * Keeps test data consistent and easy to maintain.
 */

export interface CreateTestItemOptions {
  id?: string;
  name?: string;
  description?: string;
  quantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a test Item entity with optional overrides
 */
export function createTestItem(options: CreateTestItemOptions = {}): Item {
  const defaultId = 'test-item-001';
  const defaultName = 'Test Item';
  const defaultDescription = 'This is a test item for integration tests';
  const defaultQuantity = 100;

  return Item.create({
    id: ItemId.create(options.id ?? defaultId),
    name: ItemName.create(options.name ?? defaultName),
    description: options.description ?? defaultDescription,
    quantity: options.quantity ?? defaultQuantity,
    createdAt: options.createdAt,
    updatedAt: options.updatedAt,
  });
}

/**
 * Predefined test items for consistency across tests
 */
export const TEST_ITEMS = {
  standard: createTestItem({
    id: 'test-item-001',
    name: 'Standard Test Item',
    description: 'A standard test item with typical values',
    quantity: 100,
  }),

  lowStock: createTestItem({
    id: 'test-item-002',
    name: 'Low Stock Item',
    description: 'An item with low stock for testing low stock queries',
    quantity: 5,
  }),

  outOfStock: createTestItem({
    id: 'test-item-003',
    name: 'Out of Stock Item',
    description: 'An item that is out of stock',
    quantity: 0,
  }),

  highStock: createTestItem({
    id: 'test-item-004',
    name: 'High Stock Item',
    description: 'An item with high stock levels',
    quantity: 1000,
  }),
} as const;
