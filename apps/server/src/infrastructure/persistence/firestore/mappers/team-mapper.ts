import { Timestamp } from 'firebase-admin/firestore';

import { TeamId, TeamSlug } from '../../../../domain/shared/index.js';
import { ProgrammingLanguage } from '../../../../domain/shared/programming-language.js';
import { RepoId, RepoFullName, RepoUrl } from '../../../../domain/shared/repo-types.js';
import { Team, RepoEntity } from '../../../../domain/team/team.js';

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
  repos: Array<{
    id: string;
    provider: string;
    fullName: string;
    url: string;
    defaultBranch: string;
    teamId: string;
    archived: boolean;
    language: string | null;
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
  }>;
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
  const repos = data.repos.map((repoData) =>
    RepoEntity.reconstitute({
      id: RepoId.create(repoData.id),
      provider: repoData.provider,
      fullName: RepoFullName.create(repoData.fullName),
      url: RepoUrl.create(repoData.url),
      defaultBranch: repoData.defaultBranch,
      teamId: TeamId.create(repoData.teamId),
      archived: repoData.archived,
      language: ProgrammingLanguage.fromString(repoData.language),
      createdAt: repoData.createdAt.toDate(),
      updatedAt: repoData.updatedAt.toDate(),
    }),
  );

  return Team.reconstitute({
    id: TeamId.create(data.id),
    name: data.name,
    slug: TeamSlug.create(data.slug),
    repos,
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
    repos: Array.from(team.repos).map((repo) => ({
      id: repo.id.value,
      provider: repo.provider,
      fullName: repo.fullName.value,
      url: repo.url.value,
      defaultBranch: repo.defaultBranch,
      teamId: repo.teamId.value,
      archived: repo.archived,
      language: repo.language?.value ?? null,
      createdAt: Timestamp.fromDate(repo.createdAt),
      updatedAt: Timestamp.fromDate(repo.updatedAt),
    })),
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
