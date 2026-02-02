import { Repo } from '../../domain/repo/repo.js';
import { RepoFullName, RepoId, TeamId } from '../../domain/shared/index.js';

import { BaseRepository } from './base-repository.js';

export interface RepoRepository extends BaseRepository<Repo, RepoId> {
  findByFullName(fullName: RepoFullName): Promise<Repo | null>;
  findByTeamId(teamId: TeamId): Promise<Repo[]>;
}
