import { RepoReadinessRepository } from '../../../../application/ports/repo-readiness-repository.js';
import { RepoReadiness } from '../../../../domain/repo-readiness/repo-readiness.js';
import { RepoId } from '../../../../domain/shared/repo-types.js';
import { TeamId } from '../../../../domain/shared/team-types.js';
import { FirestoreClient } from '../firestore-client.js';
import {
  repoReadinessToDocumentId,
  repoReadinessToDomain,
  repoReadinessToFirestore,
  type RepoReadinessFirestoreData,
} from '../mappers/repo-readiness-mapper.js';

/**
 * Firestore RepoReadiness Repository - Driven Adapter
 *
 * Stores readiness snapshots at: repos/{repoId}/readiness/latest
 */
export class FirestoreRepoReadinessRepository implements RepoReadinessRepository {
  private readonly reposCollectionName = 'repos';
  private readonly readinessSubcollection = 'readiness';

  constructor(private readonly firestoreClient: FirestoreClient) {}

  async findById(id: RepoId): Promise<RepoReadiness | null> {
    return this.findByRepoId(id);
  }

  async findByRepoId(repoId: RepoId): Promise<RepoReadiness | null> {
    const docRef = this.firestoreClient
      .collection(this.reposCollectionName)
      .doc(repoId.value)
      .collection(this.readinessSubcollection)
      .doc(repoReadinessToDocumentId());

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as RepoReadinessFirestoreData;
    return repoReadinessToDomain(data);
  }

  async findByTeamId(teamId: TeamId): Promise<RepoReadiness[]> {
    // Query across all repos for this team
    // Note: This requires a composite index on readiness subcollection
    const db = this.firestoreClient.getFirestore();
    const collectionGroup = db.collectionGroup(this.readinessSubcollection);
    const query = collectionGroup.where('teamId', '==', teamId.value);

    const snapshot = await query.get();

    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data() as RepoReadinessFirestoreData;
      return repoReadinessToDomain(data);
    });
  }

  async findAll(): Promise<RepoReadiness[]> {
    // Query all readiness documents using collection group
    const db = this.firestoreClient.getFirestore();
    const collectionGroup = db.collectionGroup(this.readinessSubcollection);

    const snapshot = await collectionGroup.get();

    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data() as RepoReadinessFirestoreData;
      return repoReadinessToDomain(data);
    });
  }

  async save(entity: RepoReadiness): Promise<RepoReadiness> {
    const docRef = this.firestoreClient
      .collection(this.reposCollectionName)
      .doc(entity.repoId.value)
      .collection(this.readinessSubcollection)
      .doc(repoReadinessToDocumentId());

    const data = repoReadinessToFirestore(entity);

    await docRef.set(data);

    return entity;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async update(_id: RepoId, _partial: Partial<RepoReadiness>): Promise<RepoReadiness> {
    throw new Error(
      'RepoReadiness.update() is not supported. Use save() to replace the entire snapshot.',
    );
  }

  async delete(id: RepoId): Promise<void> {
    const docRef = this.firestoreClient
      .collection(this.reposCollectionName)
      .doc(id.value)
      .collection(this.readinessSubcollection)
      .doc(repoReadinessToDocumentId());

    await docRef.delete();
  }

  async exists(id: RepoId): Promise<boolean> {
    const docRef = this.firestoreClient
      .collection(this.reposCollectionName)
      .doc(id.value)
      .collection(this.readinessSubcollection)
      .doc(repoReadinessToDocumentId());

    const docSnap = await docRef.get();
    return docSnap.exists;
  }
}
