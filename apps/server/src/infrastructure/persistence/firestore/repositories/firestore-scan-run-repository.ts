import { ScanRun } from '../../../../domain/entities/scan-run.js';
import { ScanRunRepository } from '../../../../domain/repositories/scan-run-repository.js';
import { RepoId } from '../../../../domain/value-objects/repo-value-objects.js';
import { ScanRunId } from '../../../../domain/value-objects/scan-value-objects.js';
import { EntityNotFoundError } from '../../../../shared/errors/domain-errors.js';
import { FirestoreClient } from '../firestore-client.js';
import {
  scanRunToDocumentId,
  scanRunToDomain,
  scanRunToFirestore,
  type ScanRunFirestoreData,
} from '../mappers/scan-run-mapper.js';

/**
 * Firestore ScanRun Repository - Driven Adapter
 */
export class FirestoreScanRunRepository implements ScanRunRepository {
  private readonly collectionName = 'scanRuns';

  constructor(private readonly firestoreClient: FirestoreClient) {}

  async findById(id: ScanRunId): Promise<ScanRun | null> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as ScanRunFirestoreData;
    return scanRunToDomain(data);
  }

  async findByRepoId(repoId: RepoId, limit?: number): Promise<ScanRun[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    let query = collectionRef.where('repoId', '==', repoId.value).orderBy('scannedAt', 'desc');

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as ScanRunFirestoreData;
      return scanRunToDomain(data);
    });
  }

  async findLatestByRepoId(repoId: RepoId): Promise<ScanRun | null> {
    const results = await this.findByRepoId(repoId, 1);
    return results[0] ?? null;
  }

  async findAll(): Promise<ScanRun[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const snapshot = await collectionRef.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as ScanRunFirestoreData;
      return scanRunToDomain(data);
    });
  }

  async save(entity: ScanRun): Promise<ScanRun> {
    const docId = scanRunToDocumentId(entity);
    const docRef = this.firestoreClient.document(this.collectionName, docId);
    const data = scanRunToFirestore(entity);

    await docRef.set(data);

    return entity;
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async update(_id: ScanRunId, _partial: Partial<ScanRun>): Promise<ScanRun> {
    throw new Error('ScanRun.update() is not supported. ScanRun entities are immutable.');
  }

  async delete(id: ScanRunId): Promise<void> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new EntityNotFoundError('ScanRun', id.value);
    }

    await docRef.delete();
  }

  async exists(id: ScanRunId): Promise<boolean> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();
    return docSnap.exists;
  }
}
