import { Team } from '../entities/team.js';
import { TeamId, TeamSlug } from '../value-objects/team-value-objects.js';

import { BaseRepository } from './base-repository.js';

export interface TeamRepository extends BaseRepository<Team, TeamId> {
  findBySlug(slug: TeamSlug): Promise<Team | null>;
}
