import { Repo } from '../../../../domain/entities/repo.js';
import {
  RepoFullName,
  RepoId,
  RepoUrl,
} from '../../../../domain/value-objects/repo-value-objects.js';
import { TeamId } from '../../../../domain/value-objects/team-value-objects.js';

/**
 * Firestore Document Data for Repo
 *
 * Represents how Repo data is stored in Firestore.
 * This is decoupled from the domain model to allow independent evolution.
 */
export interface RepoFirestoreData {
  id: string;
  provider: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  teamId: string;
  archived: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Repo Mapper
 *
 * Transforms between domain Repo entities and Firestore document data.
 * This keeps the domain model independent of persistence details.
 */

/**
 * Converts a Firestore document to a domain Repo entity
 * @param data Firestore document data
 * @returns Domain Repo entity
 */
export function repoToDomain(data: RepoFirestoreData): Repo {
  return Repo.reconstitute({
    id: RepoId.create(data.id),
    provider: data.provider,
    fullName: RepoFullName.create(data.fullName),
    url: RepoUrl.create(data.url),
    defaultBranch: data.defaultBranch,
    teamId: TeamId.create(data.teamId),
    archived: data.archived,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  });
}

/**
 * Converts a domain Repo entity to Firestore document data
 * @param repo Domain Repo entity
 * @returns Firestore document data
 */
export function repoToFirestore(repo: Repo): Omit<RepoFirestoreData, 'createdAt' | 'updatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: repo.id.value,
    provider: repo.provider,
    fullName: repo.fullName.value,
    url: repo.url.value,
    defaultBranch: repo.defaultBranch,
    teamId: repo.teamId.value,
    archived: repo.archived,
    createdAt: repo.createdAt,
    updatedAt: repo.updatedAt,
  };
}

/**
 * Extracts the document ID from a domain Repo entity
 * @param repo Domain Repo entity
 * @returns Document ID
 */
export function repoToDocumentId(repo: Repo): string {
  return repo.id.value;
}
