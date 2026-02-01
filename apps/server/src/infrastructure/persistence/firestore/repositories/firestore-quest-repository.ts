import { Quest } from '../../../../domain/entities/quest.js';
import { QuestRepository } from '../../../../domain/repositories/quest-repository.js';
import { QuestId } from '../../../../domain/value-objects/quest-value-objects.js';
import { EntityNotFoundError } from '../../../../shared/errors/domain-errors.js';
import { FirestoreClient } from '../firestore-client.js';
import {
  questToDocumentId,
  questToDomain,
  questToFirestore,
  type QuestFirestoreData,
} from '../mappers/quest-mapper.js';

/**
 * Firestore Quest Repository - Driven Adapter
 *
 * Implements the QuestRepository interface (outbound port) defined in the domain layer.
 * This adapter translates domain operations to Firestore-specific operations.
 */
export class FirestoreQuestRepository implements QuestRepository {
  private readonly collectionName = 'quests';

  constructor(private readonly firestoreClient: FirestoreClient) {}

  /**
   * Finds a quest by its ID
   */
  async findById(id: QuestId): Promise<Quest | null> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as QuestFirestoreData;
    return questToDomain(data);
  }

  /**
   * Finds a quest by its key
   */
  async findByKey(key: string): Promise<Quest | null> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const query = collectionRef.where('key', '==', key);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return null;
    }

    // Key should be unique, but we'll return the first match
    const data = snapshot.docs[0]?.data() as QuestFirestoreData;
    return questToDomain(data);
  }

  /**
   * Finds all quests in a category
   */
  async findByCategory(category: string): Promise<Quest[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const query = collectionRef.where('category', '==', category);
    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as QuestFirestoreData;
      return questToDomain(data);
    });
  }

  /**
   * Finds all active quests
   */
  async findActive(): Promise<Quest[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const query = collectionRef.where('active', '==', true);
    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as QuestFirestoreData;
      return questToDomain(data);
    });
  }

  /**
   * Retrieves all quests
   */
  async findAll(): Promise<Quest[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const snapshot = await collectionRef.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as QuestFirestoreData;
      return questToDomain(data);
    });
  }

  /**
   * Saves a new quest or updates an existing one
   */
  async save(entity: Quest): Promise<Quest> {
    const docId = questToDocumentId(entity);
    const docRef = this.firestoreClient.document(this.collectionName, docId);
    const data = questToFirestore(entity);

    await docRef.set(data);

    return entity;
  }

  /**
   * Updates a quest (for Quest, we just save the whole entity since updates are done via domain methods)
   * @throws Error - This method is not supported for Quest entities
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async update(_id: QuestId, _partial: Partial<Quest>): Promise<Quest> {
    // For Quest, partial updates don't make sense as the entity manages its own state
    // This method exists to satisfy the interface but shouldn't typically be used
    // Instead, use domain methods (activate, deactivate, updateDescription) and then save()
    throw new Error(
      'Quest.update() is not supported. Use domain methods (activate/deactivate/updateDescription) and then save() instead.',
    );
  }

  /**
   * Deletes a quest
   */
  async delete(id: QuestId): Promise<void> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new EntityNotFoundError('Quest', id.value);
    }

    await docRef.delete();
  }

  /**
   * Checks if a quest exists
   */
  async exists(id: QuestId): Promise<boolean> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();
    return docSnap.exists;
  }
}
