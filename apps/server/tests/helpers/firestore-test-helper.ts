import { loadEnvironmentConfig } from '../../src/infrastructure/config/environment.js';
import { FirebaseConfig } from '../../src/infrastructure/config/firebase.config.js';
import { FirestoreClient } from '../../src/infrastructure/persistence/firestore/firestore-client.js';

/**
 * Firestore Test Helper
 *
 * Provides utilities for setting up and tearing down Firestore
 * data during integration tests.
 */

const ITEMS_COLLECTION = 'items';

let firestoreClient: FirestoreClient | null = null;
let firebaseConfig: FirebaseConfig | null = null;

/**
 * Initializes a Firestore client for testing
 * Should be called in beforeAll() or beforeEach()
 */
export function initializeTestFirestore(): FirestoreClient {
  if (!firestoreClient) {
    // Load environment configuration
    const config = loadEnvironmentConfig();

    // Initialize Firebase Admin SDK
    firebaseConfig = new FirebaseConfig(config);
    firebaseConfig.initialize();

    // Create Firestore client
    const firestore = firebaseConfig.getFirestore();
    firestoreClient = new FirestoreClient(firestore);
  }

  return firestoreClient;
}

/**
 * Clears all documents from a collection
 * Should be called in afterEach() to ensure test isolation
 */
export async function clearCollection(collectionName: string): Promise<void> {
  if (!firestoreClient) {
    throw new Error('Firestore client not initialized. Call initializeTestFirestore() first.');
  }

  const collection = firestoreClient.collection(collectionName);
  const snapshot = await collection.get();

  // Use batch delete for efficiency
  const batch = firestoreClient.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

/**
 * Clears all documents from the items collection
 * Should be called in afterEach() to ensure test isolation
 */
export async function clearItemsCollection(): Promise<void> {
  return clearCollection(ITEMS_COLLECTION);
}

/**
 * Gets the Firestore client instance for tests
 */
export function getTestFirestoreClient(): FirestoreClient {
  if (!firestoreClient) {
    throw new Error('Firestore client not initialized. Call initializeTestFirestore() first.');
  }

  return firestoreClient;
}

/**
 * Verifies that a document exists in Firestore
 * Useful for assertions in tests
 */
export async function documentExists(collectionName: string, documentId: string): Promise<boolean> {
  if (!firestoreClient) {
    throw new Error('Firestore client not initialized. Call initializeTestFirestore() first.');
  }

  const docRef = firestoreClient.document(collectionName, documentId);
  const snapshot = await docRef.get();

  return snapshot.exists;
}

/**
 * Gets the count of documents in a collection
 * Useful for assertions in tests
 */
export async function getCollectionCount(collectionName: string): Promise<number> {
  if (!firestoreClient) {
    throw new Error('Firestore client not initialized. Call initializeTestFirestore() first.');
  }

  const collection = firestoreClient.collection(collectionName);
  const snapshot = await collection.get();

  return snapshot.size;
}
