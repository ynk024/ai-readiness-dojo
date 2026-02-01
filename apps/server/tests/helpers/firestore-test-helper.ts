import { loadEnvironmentConfig } from '../../src/infrastructure/config/environment.js';
import { FirebaseConfig } from '../../src/infrastructure/config/firebase.config.js';
import { FirestoreClient } from '../../src/infrastructure/persistence/firestore/firestore-client.js';

import type { CollectionReference, DocumentReference, Firestore } from 'firebase-admin/firestore';

/**
 * Firestore Test Helper
 *
 * Provides utilities for setting up and tearing down Firestore
 * data during integration tests with test isolation via collection prefixes.
 */

const ITEMS_COLLECTION = 'items';

let firebaseConfig: FirebaseConfig | null = null;
let baseFirestore: Firestore | null = null;

/**
 * Isolated Firestore Client that prefixes all collection names
 * to provide test isolation when running tests in parallel
 */
export class IsolatedFirestoreClient extends FirestoreClient {
  constructor(
    firestore: Firestore,
    private readonly prefix: string,
  ) {
    super(firestore);
  }

  /**
   * Prefixes collection name with test prefix
   */
  private prefixCollection(collectionName: string): string {
    return `${this.prefix}_${collectionName}`;
  }

  /**
   * Override collection to use prefixed name
   */
  override collection(collectionName: string): CollectionReference {
    return super.collection(this.prefixCollection(collectionName));
  }

  /**
   * Override document to use prefixed collection name
   */
  override document(collectionName: string, documentId: string): DocumentReference {
    return super.document(this.prefixCollection(collectionName), documentId);
  }

  /**
   * Get the test prefix
   */
  getPrefix(): string {
    return this.prefix;
  }
}

/**
 * Initializes the base Firestore instance (singleton)
 */
function initializeBaseFirestore(): Firestore {
  if (!baseFirestore) {
    // Load environment configuration
    const config = loadEnvironmentConfig();

    // Initialize Firebase Admin SDK
    firebaseConfig = new FirebaseConfig(config);
    firebaseConfig.initialize();

    // Get Firestore instance
    baseFirestore = firebaseConfig.getFirestore();
  }

  return baseFirestore;
}

/**
 * Creates an isolated Firestore client for a test file
 * Each test file should use a unique prefix to avoid data contamination
 *
 * @param testPrefix - Unique prefix for this test file (e.g., 'item_repo_test')
 * @returns Isolated Firestore client that prefixes all collections
 */
export function createTestFirestoreClient(testPrefix: string): IsolatedFirestoreClient {
  const firestore = initializeBaseFirestore();
  return new IsolatedFirestoreClient(firestore, testPrefix);
}

/**
 * Clears all documents from a collection
 * Should be called in afterEach() to ensure test isolation
 */
export async function clearCollection(
  collectionName: string,
  client?: FirestoreClient,
): Promise<void> {
  const firestoreClient = client ?? createTestFirestoreClient('default');

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
export async function clearItemsCollection(client?: FirestoreClient): Promise<void> {
  return clearCollection(ITEMS_COLLECTION, client);
}

/**
 * Verifies that a document exists in Firestore
 * Useful for assertions in tests
 */
export async function documentExists(
  collectionName: string,
  documentId: string,
  client?: FirestoreClient,
): Promise<boolean> {
  const firestoreClient = client ?? createTestFirestoreClient('default');

  const docRef = firestoreClient.document(collectionName, documentId);
  const snapshot = await docRef.get();

  return snapshot.exists;
}

/**
 * Gets the count of documents in a collection
 * Useful for assertions in tests
 */
export async function getCollectionCount(
  collectionName: string,
  client?: FirestoreClient,
): Promise<number> {
  const firestoreClient = client ?? createTestFirestoreClient('default');

  const collection = firestoreClient.collection(collectionName);
  const snapshot = await collection.get();

  return snapshot.size;
}

/**
 * Tears down an isolated test Firestore client by deleting all its prefixed collections
 * Should be called in afterAll() to clean up test data
 *
 * @param client - The isolated Firestore client to tear down
 */
export async function teardownTestFirestore(client: IsolatedFirestoreClient): Promise<void> {
  if (!baseFirestore) {
    return; // Nothing to clean up
  }

  const prefix = client.getPrefix();

  // Get all collections in Firestore
  const collections = await baseFirestore.listCollections();

  // Find and delete all collections that match our test prefix
  const deletePromises = collections
    .filter((collection) => collection.id.startsWith(`${prefix}_`))
    .map(async (collection) => {
      const snapshot = await collection.get();
      const batch = baseFirestore!.batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    });

  await Promise.all(deletePromises);
}
