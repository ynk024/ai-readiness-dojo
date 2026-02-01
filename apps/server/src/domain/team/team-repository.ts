import { BaseRepository } from '../../shared/base-repository.js';
import { TeamId, TeamSlug } from '../shared/team-types.js';

import { Team } from './team.js';

export interface TeamRepository extends BaseRepository<Team, TeamId> {
  findBySlug(slug: TeamSlug): Promise<Team | null>;
}
