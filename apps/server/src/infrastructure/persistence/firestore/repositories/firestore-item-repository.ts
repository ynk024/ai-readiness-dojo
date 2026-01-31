import { Item } from '../../../../domain/entities/item.js';
import { ItemRepository } from '../../../../domain/repositories/item-repository.js';
import { ItemId } from '../../../../domain/value-objects/item-value-objects.js';
import { EntityNotFoundError } from '../../../../shared/errors/domain-errors.js';
import { FirestoreClient } from '../firestore-client.js';
import {
  itemToDomain,
  itemToDocumentId,
  itemToFirestore,
  itemToFirestorePartial,
  type ItemFirestoreData,
} from '../mappers/item-mapper.js';

/**
 * Firestore Item Repository - Driven Adapter
 *
 * Implements the ItemRepository interface (outbound port) defined in the domain layer.
 * This adapter translates domain operations to Firestore-specific operations.
 *
 * Following hexagonal architecture, this allows the domain to remain independent
 * of Firestore, making it easy to swap persistence technologies later.
 */
export class FirestoreItemRepository implements ItemRepository {
  private readonly collectionName = 'items';

  constructor(private readonly firestoreClient: FirestoreClient) {}

  /**
   * Finds an item by its ID
   */
  async findById(id: ItemId): Promise<Item | null> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as ItemFirestoreData;
    return itemToDomain(data);
  }

  /**
   * Retrieves all items
   */
  async findAll(): Promise<Item[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const snapshot = await collectionRef.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as ItemFirestoreData;
      return itemToDomain(data);
    });
  }

  /**
   * Saves a new item or updates an existing one
   */
  async save(entity: Item): Promise<Item> {
    const docId = itemToDocumentId(entity);
    const docRef = this.firestoreClient.document(this.collectionName, docId);
    const data = itemToFirestore(entity);

    await docRef.set(data);

    // Return the entity as-is since Firestore doesn't modify it
    return entity;
  }

  /**
   * Updates specific fields of an item
   */
  async update(id: ItemId, partial: Partial<Item>): Promise<Item> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new EntityNotFoundError('Item', id.value);
    }

    // Convert partial Item to Firestore update data
    const updateData = itemToFirestorePartial({
      name: partial.name,
      description: partial.description,
      quantity: partial.quantity,
    });

    await docRef.update(updateData);

    // Fetch and return the updated entity
    const updatedSnap = await docRef.get();
    const data = updatedSnap.data() as ItemFirestoreData;
    return itemToDomain(data);
  }

  /**
   * Deletes an item
   */
  async delete(id: ItemId): Promise<void> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new EntityNotFoundError('Item', id.value);
    }

    await docRef.delete();
  }

  /**
   * Checks if an item exists
   */
  async exists(id: ItemId): Promise<boolean> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();
    return docSnap.exists;
  }

  /**
   * Finds items by name (partial match)
   */
  async findByName(nameFragment: string): Promise<Item[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);

    // Note: Firestore doesn't support native full-text search or LIKE queries.
    // For production, consider using:
    // 1. Firestore + Algolia/Elasticsearch for advanced search
    // 2. Cloud Functions to maintain search indexes
    // 3. Client-side filtering for small datasets
    //
    // This implementation fetches all and filters client-side (acceptable for demos)
    const snapshot = await collectionRef.get();

    const allItems = snapshot.docs.map((doc) => {
      const data = doc.data() as ItemFirestoreData;
      return itemToDomain(data);
    });

    // Filter by name fragment (case-insensitive)
    const searchTerm = nameFragment.toLowerCase();
    return allItems.filter((item) => item.name.value.toLowerCase().includes(searchTerm));
  }

  /**
   * Finds items with quantity below a threshold
   */
  async findLowStock(threshold: number): Promise<Item[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const query = collectionRef.where('quantity', '<', threshold);
    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as ItemFirestoreData;
      return itemToDomain(data);
    });
  }

  /**
   * Finds items created within a date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Item[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const query = collectionRef
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate);
    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as ItemFirestoreData;
      return itemToDomain(data);
    });
  }
}
