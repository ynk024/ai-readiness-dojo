import { Repo } from '../entities/repo.js';
import { RepoId, RepoFullName } from '../value-objects/repo-value-objects.js';
import { TeamId } from '../value-objects/team-value-objects.js';

import { BaseRepository } from './base-repository.js';

export interface RepoRepository extends BaseRepository<Repo, RepoId> {
  findByFullName(fullName: RepoFullName): Promise<Repo | null>;
  findByTeamId(teamId: TeamId): Promise<Repo[]>;
}
