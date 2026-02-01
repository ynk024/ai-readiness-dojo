import { RepoId, TeamId, TeamSlug } from '../../../../domain/shared/index.js';
import { Team } from '../../../../domain/team/team.js';

/**
 * Firestore Document Data for Team
 *
 * Represents how Team data is stored in Firestore.
 * This is decoupled from the domain model to allow independent evolution.
 */
export interface TeamFirestoreData {
  id: string;
  name: string;
  slug: string;
  repoIds: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Team Mapper
 *
 * Transforms between domain Team entities and Firestore document data.
 * This keeps the domain model independent of persistence details.
 */

/**
 * Converts a Firestore document to a domain Team entity
 * @param data Firestore document data
 * @returns Domain Team entity
 */
export function teamToDomain(data: TeamFirestoreData): Team {
  return Team.reconstitute({
    id: TeamId.create(data.id),
    name: data.name,
    slug: TeamSlug.create(data.slug),
    repoIds: data.repoIds.map((id) => RepoId.create(id)),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  });
}

/**
 * Converts a domain Team entity to Firestore document data
 * @param team Domain Team entity
 * @returns Firestore document data
 */
export function teamToFirestore(team: Team): Omit<TeamFirestoreData, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: team.id.value,
    name: team.name,
    slug: team.slug.value,
    repoIds: Array.from(team.repoIds).map((id) => id.value),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}

/**
 * Extracts the document ID from a domain Team entity
 * @param team Domain Team entity
 * @returns Document ID
 */
export function teamToDocumentId(team: Team): string {
  return team.id.value;
}
