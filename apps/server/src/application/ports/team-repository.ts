import { TeamId, TeamSlug } from '../../domain/shared/team-types.js';
import { Team } from '../../domain/team/team.js';

import { BaseRepository } from './base-repository.js';

export interface TeamRepository extends BaseRepository<Team, TeamId> {
  findBySlug(slug: TeamSlug): Promise<Team | null>;
}
