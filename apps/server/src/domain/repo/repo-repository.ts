import { BaseRepository } from '../../shared/base-repository.js';
import { RepoFullName, RepoId, TeamId } from '../shared/index.js';

import { Repo } from './repo.js';

export interface RepoRepository extends BaseRepository<Repo, RepoId> {
  findByFullName(fullName: RepoFullName): Promise<Repo | null>;
  findByTeamId(teamId: TeamId): Promise<Repo[]>;
}
