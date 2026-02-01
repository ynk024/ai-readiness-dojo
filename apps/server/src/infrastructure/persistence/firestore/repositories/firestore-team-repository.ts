import { TeamId, TeamSlug } from '../../../../domain/shared/team-types.js';
import { TeamRepository } from '../../../../domain/team/team-repository.js';
import { Team } from '../../../../domain/team/team.js';
import { EntityNotFoundError } from '../../../../shared/errors/domain-errors.js';
import { FirestoreClient } from '../firestore-client.js';
import {
  teamToDocumentId,
  teamToDomain,
  teamToFirestore,
  type TeamFirestoreData,
} from '../mappers/team-mapper.js';

/**
 * Firestore Team Repository - Driven Adapter
 *
 * Implements the TeamRepository interface (outbound port) defined in the domain layer.
 * This adapter translates domain operations to Firestore-specific operations.
 */
export class FirestoreTeamRepository implements TeamRepository {
  private readonly collectionName = 'teams';

  constructor(private readonly firestoreClient: FirestoreClient) {}

  /**
   * Finds a team by its ID
   */
  async findById(id: TeamId): Promise<Team | null> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as TeamFirestoreData;
    return teamToDomain(data);
  }

  /**
   * Finds a team by its slug
   */
  async findBySlug(slug: TeamSlug): Promise<Team | null> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const query = collectionRef.where('slug', '==', slug.value);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return null;
    }

    // Slug should be unique, but we'll return the first match
    const data = snapshot.docs[0]?.data() as TeamFirestoreData;
    return teamToDomain(data);
  }

  /**
   * Retrieves all teams
   */
  async findAll(): Promise<Team[]> {
    const collectionRef = this.firestoreClient.collection(this.collectionName);
    const snapshot = await collectionRef.get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as TeamFirestoreData;
      return teamToDomain(data);
    });
  }

  /**
   * Saves a new team or updates an existing one
   */
  async save(entity: Team): Promise<Team> {
    const docId = teamToDocumentId(entity);
    const docRef = this.firestoreClient.document(this.collectionName, docId);
    const data = teamToFirestore(entity);

    await docRef.set(data);

    return entity;
  }

  /**
   * Updates a team (for Team, we just save the whole entity since updates are done via domain methods)
   * @throws Error - This method is not supported for Team entities
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async update(_id: TeamId, _partial: Partial<Team>): Promise<Team> {
    // For Team, partial updates don't make sense as the entity manages its own state
    // This method exists to satisfy the interface but shouldn't typically be used
    // Instead, use domain methods (addRepo, removeRepo) and then save()
    throw new Error(
      'Team.update() is not supported. Use domain methods (addRepo/removeRepo) and then save() instead.',
    );
  }

  /**
   * Deletes a team
   */
  async delete(id: TeamId): Promise<void> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new EntityNotFoundError('Team', id.value);
    }

    await docRef.delete();
  }

  /**
   * Checks if a team exists
   */
  async exists(id: TeamId): Promise<boolean> {
    const docRef = this.firestoreClient.document(this.collectionName, id.value);
    const docSnap = await docRef.get();
    return docSnap.exists;
  }
}
