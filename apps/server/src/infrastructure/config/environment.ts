/**
 * Environment Configuration
 *
 * Validates and provides type-safe access to environment variables.
 */

export interface EnvironmentConfig {
  // Server configuration
  port: number;
  host: string;
  nodeEnv: 'development' | 'test' | 'production';

  // Firebase configuration
  firebaseProjectId: string;
  firebaseServiceAccountPath?: string;
  firestoreEmulatorHost?: string;
}

/**
 * Loads and validates environment variables
 * @throws {Error} If required environment variables are missing
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as 'development' | 'test' | 'production';

  // Firebase configuration
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  if (!firebaseProjectId) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is required');
  }

  const firebaseServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

  // Server configuration
  const DEFAULT_PORT = 3000;
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;
  const host = process.env.HOST ?? '0.0.0.0';

  return {
    port,
    host,
    nodeEnv,
    firebaseProjectId,
    firebaseServiceAccountPath,
    firestoreEmulatorHost,
  };
}
