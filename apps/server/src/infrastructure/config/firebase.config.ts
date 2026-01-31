import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Firestore } from 'firebase-admin/firestore';

import type { EnvironmentConfig } from './environment.js';

/**
 * Firebase Configuration
 *
 * Initializes Firebase Admin SDK and provides access to Firestore.
 * Supports both production (service account) and development (emulator) modes.
 */
export class FirebaseConfig {
  private app: App | null = null;
  private firestoreInstance: Firestore | null = null;

  constructor(private readonly config: EnvironmentConfig) {}

  /**
   * Initializes Firebase Admin SDK
   */
  initialize(): void {
    if (this.app) {
      return; // Already initialized
    }

    // Check if running with emulator
    const useEmulator = Boolean(this.config.firestoreEmulatorHost);

    if (useEmulator) {
      // Initialize for emulator
      this.app = admin.initializeApp({
        projectId: this.config.firebaseProjectId,
      });

      // Configure Firestore to use emulator
      process.env.FIRESTORE_EMULATOR_HOST = this.config.firestoreEmulatorHost;
    } else {
      // Initialize for production with service account
      if (!this.config.firebaseServiceAccountPath) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is required when not using emulator');
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert(this.config.firebaseServiceAccountPath),
        projectId: this.config.firebaseProjectId,
      });
    }
  }

  /**
   * Gets the Firestore instance
   */
  getFirestore(): Firestore {
    if (!this.app) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }

    if (!this.firestoreInstance) {
      this.firestoreInstance = admin.firestore();
    }

    return this.firestoreInstance;
  }

  /**
   * Closes the Firebase connection
   */
  async close(): Promise<void> {
    if (this.app) {
      await admin.app().delete();
      this.app = null;
      this.firestoreInstance = null;
    }
  }
}
