import type { Firestore } from 'firebase-admin/firestore';

/**
 * Firestore Client Wrapper
 *
 * Provides a wrapper around Firestore SDK for common operations.
 * This abstraction allows for easier testing and potential future
 * replacement of the persistence technology.
 */
export class FirestoreClient {
  constructor(private readonly firestore: Firestore) {}

  /**
   * Gets a reference to a collection
   */
  collection(collectionName: string): FirebaseFirestore.CollectionReference {
    return this.firestore.collection(collectionName);
  }

  /**
   * Gets a reference to a document
   */
  document(collectionName: string, documentId: string): FirebaseFirestore.DocumentReference {
    return this.firestore.collection(collectionName).doc(documentId);
  }

  /**
   * Executes a transaction
   */
  async runTransaction<T>(
    updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
  ): Promise<T> {
    return this.firestore.runTransaction(updateFunction);
  }

  /**
   * Creates a batch write
   */
  batch(): FirebaseFirestore.WriteBatch {
    return this.firestore.batch();
  }

  /**
   * Gets the underlying Firestore instance
   * Use sparingly - prefer using wrapper methods
   */
  getFirestore(): Firestore {
    return this.firestore;
  }
}
