import { RepoRepository } from '../../../../domain/repo/repo-repository.js';
import { Repo } from '../../../../domain/repo/repo.js';
import { RepoFullName, RepoId, TeamId } from '../../../../domain/shared/index.js';
import { EntityNotFoundError } from '../../../../shared/errors/domain-errors.js';
import { FirestoreClient } from '../firestore-client.js';
import {
  repoToDocumentId,
  repoToDomain,
  repoToFirestore,
  type RepoFirestoreData,
} from '../mappers/repo-mapper.js';

/**
 * Firestore Repo Repository - Driven Adapter
 *
 * Implements the RepoRepository interface (outbound port) defined in the domain layer.
 */
export class FirestoreRepoRepository implements RepoRepository {
  private readonly collectionName = 'repos';

  constructor(private readonly firestoreClient: FirestoreClient) {}

  async findById(id: RepoId): Promise<Repo | null> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as RepoFirestoreData;
    return repoToDomain(data);
  }

  async findByFullName(fullName: RepoFullName): Promise<Repo | null> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const query = collectionRef.where('fullName', '==', fullName.value);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0]?.data() as RepoFirestoreData;
    return repoToDomain(data);
  }

  async findByTeamId(teamId: TeamId): Promise<Repo[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const query = collectionRef.where('teamId', '==', teamId.value);
    const snapshot = await query.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as RepoFirestoreData;
      return repoToDomain(data);
    });
  }

  async findAll(): Promise<Repo[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const snapshot = await collectionRef.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as RepoFirestoreData;
      return repoToDomain(data);
    });
  }

  async save(entity: Repo): Promise<Repo> {
    const docId = repoToDocumentId(entity);
    const docRef = this.firestoreClient.document(this.collectionName, docId);
    const data = repoToFirestore(entity);

    await docRef.set(data);

    return entity;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async update(_id: RepoId, _partial: Partial<Repo>): Promise<Repo> {
    throw new Error(
      'Repo.update() is not supported. Use domain methods (archive/unarchive/updateDefaultBranch) and then save() instead.',
    );
  }

  async delete(id: RepoId): Promise<void> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new EntityNotFoundError('Repo', id.value);
    }

    await docRef.delete();
  }

  async exists(id: RepoId): Promise<boolean> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();
    return docSnap.exists;
  }
}
