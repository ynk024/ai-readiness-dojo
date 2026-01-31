import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ItemId } from '../../../src/domain/value-objects/item-value-objects.js';
import { FirestoreItemRepository } from '../../../src/infrastructure/persistence/firestore/repositories/firestore-item-repository.js';
import {
  clearItemsCollection,
  documentExists,
  getCollectionCount,
  initializeTestFirestore,
} from '../../helpers/firestore-test-helper.js';
import { createTestItem, TEST_ITEMS } from '../../helpers/test-data-factory.js';

/**
 * Firestore Item Repository Integration Tests
 *
 * These tests verify the Firestore repository implementation using the emulator.
 * They focus on the critical create and read operations to ensure data persistence works correctly.
 *
 * Prerequisites:
 * - Firestore emulator must be running on localhost:8080
 * - Run: pnpm emulator:start (in another terminal)
 * - Or set FIRESTORE_EMULATOR_HOST=localhost:8080 in .env.test
 */

describe('FirestoreItemRepository - Integration Tests', () => {
  let repository: FirestoreItemRepository;

  beforeAll(() => {
    // Initialize Firestore client for testing
    const firestoreClient = initializeTestFirestore();
    repository = new FirestoreItemRepository(firestoreClient);
  });

  afterEach(async () => {
    // Clear all test data after each test to ensure isolation
    await clearItemsCollection();
  });

  describe('save() - Create Item', () => {
    it('should save a new item to Firestore', async () => {
      // Arrange
      const testItem = createTestItem({
        id: 'integration-test-001',
        name: 'Integration Test Item',
        description: 'Testing Firestore save operation',
        quantity: 50,
      });

      // Act
      const savedItem = await repository.save(testItem);

      // Assert
      expect(savedItem.id.value).toBe('integration-test-001');
      expect(savedItem.name.value).toBe('Integration Test Item');
      expect(savedItem.description).toBe('Testing Firestore save operation');
      expect(savedItem.quantity).toBe(50);

      // Verify item was actually persisted to Firestore
      const exists = await documentExists('items', 'integration-test-001');
      expect(exists).toBe(true);
    });

    it('should save multiple items to Firestore', async () => {
      // Arrange
      const item1 = TEST_ITEMS.standard;
      const item2 = TEST_ITEMS.lowStock;

      // Act
      await repository.save(item1);
      await repository.save(item2);

      // Assert
      const count = await getCollectionCount('items');
      expect(count).toBe(2);
    });

    it('should handle item with zero quantity', async () => {
      // Arrange
      const outOfStockItem = TEST_ITEMS.outOfStock;

      // Act
      const savedItem = await repository.save(outOfStockItem);

      // Assert
      expect(savedItem.quantity).toBe(0);
      expect(savedItem.isInStock()).toBe(false);
    });
  });

  describe('findById() - Read Single Item', () => {
    it('should retrieve an item by ID', async () => {
      // Arrange - Save an item first
      const testItem = createTestItem({
        id: 'find-by-id-test',
        name: 'Find By ID Test',
        quantity: 75,
      });
      await repository.save(testItem);

      // Act - Retrieve the item
      const foundItem = await repository.findById(ItemId.create('find-by-id-test'));

      // Assert
      expect(foundItem).not.toBeNull();
      expect(foundItem?.id.value).toBe('find-by-id-test');
      expect(foundItem?.name.value).toBe('Find By ID Test');
      expect(foundItem?.quantity).toBe(75);
    });

    it('should return null when item does not exist', async () => {
      // Act
      const foundItem = await repository.findById(ItemId.create('non-existent-item'));

      // Assert
      expect(foundItem).toBeNull();
    });

    it('should correctly map data between Firestore and domain', async () => {
      // Arrange
      const testItem = createTestItem({
        id: 'mapping-test',
        name: 'Mapping Test Item',
        description: 'Testing domain-Firestore mapping',
        quantity: 100,
      });
      await repository.save(testItem);

      // Act
      const retrievedItem = await repository.findById(ItemId.create('mapping-test'));

      // Assert - Verify all fields are correctly mapped
      expect(retrievedItem).not.toBeNull();
      expect(retrievedItem?.id.value).toBe(testItem.id.value);
      expect(retrievedItem?.name.value).toBe(testItem.name.value);
      expect(retrievedItem?.description).toBe(testItem.description);
      expect(retrievedItem?.quantity).toBe(testItem.quantity);
      expect(retrievedItem?.createdAt).toBeInstanceOf(Date);
      expect(retrievedItem?.updatedAt).toBeInstanceOf(Date);
      expect(retrievedItem?.isInStock()).toBe(true);
    });
  });

  describe('findAll() - Read All Items', () => {
    it('should retrieve all items from Firestore', async () => {
      // Arrange - Save multiple items
      await repository.save(TEST_ITEMS.standard);
      await repository.save(TEST_ITEMS.lowStock);
      await repository.save(TEST_ITEMS.highStock);

      // Act
      const allItems = await repository.findAll();

      // Assert - Verify we got all 3 items
      expect(allItems).toHaveLength(3);
      expect(allItems[0]).toBeDefined();
      expect(allItems[1]).toBeDefined();
      expect(allItems[2]).toBeDefined();
    });

    it('should return empty array when collection is empty', async () => {
      // Act - No items saved
      const allItems = await repository.findAll();

      // Assert
      expect(allItems).toEqual([]);
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across multiple read operations', async () => {
      // Arrange
      const testItem = createTestItem({
        id: 'persistence-test',
        name: 'Persistence Test',
        quantity: 200,
      });
      await repository.save(testItem);

      // Act - Read the same item multiple times
      const read1 = await repository.findById(ItemId.create('persistence-test'));
      const read2 = await repository.findById(ItemId.create('persistence-test'));
      const read3 = await repository.findById(ItemId.create('persistence-test'));

      // Assert - All reads should return consistent data
      expect(read1?.id.value).toBe('persistence-test');
      expect(read2?.id.value).toBe('persistence-test');
      expect(read3?.id.value).toBe('persistence-test');
      expect(read1?.quantity).toBe(200);
      expect(read2?.quantity).toBe(200);
      expect(read3?.quantity).toBe(200);
    });
  });
});
