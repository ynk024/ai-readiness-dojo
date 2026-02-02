import { RepoReadiness } from '../../domain/repo-readiness/repo-readiness.js';
import { RepoId } from '../../domain/shared/repo-types.js';
import { TeamId } from '../../domain/shared/team-types.js';

import { BaseRepository } from './base-repository.js';

/**
 * Repository port for RepoReadiness aggregate
 */
export interface RepoReadinessRepository extends BaseRepository<RepoReadiness, RepoId> {
  /**
   * Find readiness snapshot by repository ID
   */
  findByRepoId(repoId: RepoId): Promise<RepoReadiness | null>;

  /**
   * Find all readiness snapshots for a team
   */
  findByTeamId(teamId: TeamId): Promise<RepoReadiness[]>;
}
