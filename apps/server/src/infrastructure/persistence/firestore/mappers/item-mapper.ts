import { Item } from '../../../../domain/entities/item.js';
import { ItemId, ItemName } from '../../../../domain/value-objects/item-value-objects.js';

/**
 * Firestore Document Data for Item
 *
 * Represents how Item data is stored in Firestore.
 * This is decoupled from the domain model to allow independent evolution.
 */
export interface ItemFirestoreData {
  id: string;
  name: string;
  description: string;
  quantity: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Item Mapper
 *
 * Transforms between domain Item entities and Firestore document data.
 * This keeps the domain model independent of persistence details.
 */

/**
 * Converts a Firestore document to a domain Item entity
 * @param data Firestore document data
 * @returns Domain Item entity
 */
export function itemToDomain(data: ItemFirestoreData): Item {
  return Item.reconstitute({
    id: ItemId.create(data.id),
    name: ItemName.create(data.name),
    description: data.description,
    quantity: data.quantity,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  });
}

/**
 * Converts a domain Item entity to Firestore document data
 * @param item Domain Item entity
 * @returns Firestore document data
 */
export function itemToFirestore(item: Item): Omit<ItemFirestoreData, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: item.id.value,
    name: item.name.value,
    description: item.description,
    quantity: item.quantity,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * Extracts the document ID from a domain Item entity
 * @param item Domain Item entity
 * @returns Document ID
 */
export function itemToDocumentId(item: Item): string {
  return item.id.value;
}

/**
 * Converts partial domain data to Firestore update data
 * Used for partial updates
 */
export function itemToFirestorePartial(
  partial: Partial<{
    name: ItemName;
    description: string;
    quantity: number;
  }>,
): Partial<Omit<ItemFirestoreData, 'id' | 'createdAt' | 'updatedAt'>> & { updatedAt: Date } {
  const updateData: Partial<Omit<ItemFirestoreData, 'id' | 'createdAt' | 'updatedAt'>> & {
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (partial.name) {
    updateData.name = partial.name.value;
  }
  if (partial.description !== undefined) {
    updateData.description = partial.description;
  }
  if (partial.quantity !== undefined) {
    updateData.quantity = partial.quantity;
  }

  return updateData;
}
