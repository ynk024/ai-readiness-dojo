import { RepoId, RepoFullName, RepoUrl } from '../../domain/shared/repo-types.js';
import { TeamId, TeamSlug } from '../../domain/shared/team-types.js';
import { Team, type RepoEntity } from '../../domain/team/team.js';

import type { RepoMetadata } from '../dto/repo-metadata.dto.js';
import type { TeamRepository } from '../ports/team-repository.js';

/**
 * Result of resolving team and repo from metadata
 */
export interface TeamRepoResult {
  team: Team;
  repo: RepoEntity;
}

/**
 * Service for resolving or auto-creating teams and repositories from metadata.
 * Implements the auto-creation logic for teams and repos during scan ingestion.
 */
export class TeamRepoResolver {
  constructor(private readonly teamRepository: TeamRepository) {}

  /**
   * Resolve team and repo from metadata, creating them if they don't exist.
   *
   * Auto-creation logic:
   * 1. Extract owner from repo metadata → derive team slug
   * 2. Find or create team using owner as team name/slug
   * 3. Find or create repo within team
   * 4. Return both team and repo
   *
   * @param metadata - Repository metadata from AI-Readiness report
   * @returns Team and Repo entities
   */
  async resolveFromMetadata(metadata: RepoMetadata): Promise<TeamRepoResult> {
    const teamId = TeamRepoResolver.generateTeamId(metadata.owner);
    const repoId = TeamRepoResolver.generateRepoId(metadata.owner, metadata.name);
    const teamSlug = TeamSlug.create(metadata.owner.toLowerCase());

    let team = await this.teamRepository.findBySlug(teamSlug);

    if (!team) {
      team = Team.create({
        id: teamId,
        name: metadata.owner,
        slug: teamSlug,
      });
      await this.teamRepository.save(team);
    }

    const repoFullName = RepoFullName.create(metadata.fullName);
    let repo = team.getRepoByFullName(repoFullName);

    if (!repo) {
      const defaultBranch = metadata.refName.startsWith('refs/heads/')
        ? metadata.refName.substring('refs/heads/'.length)
        : metadata.refName;

      repo = team.addRepo({
        id: repoId,
        provider: 'github',
        fullName: repoFullName,
        url: RepoUrl.create(metadata.url),
        defaultBranch,
        teamId,
        archived: false,
      });
      await this.teamRepository.save(team);
    }

    return { team, repo };
  }

  /**
   * Generate team ID from owner name
   * Convention: team_{lowercase_owner}
   */
  static generateTeamId(owner: string): TeamId {
    const normalizedOwner = owner.toLowerCase();
    return TeamId.create(`team_${normalizedOwner}`);
  }

  /**
   * Generate repo ID from owner and repo name
   * Convention: repo_{lowercase_owner}_{lowercase_name}
   */
  static generateRepoId(owner: string, name: string): RepoId {
    const normalizedOwner = owner.toLowerCase();
    const normalizedName = name.toLowerCase();
    return RepoId.create(`repo_${normalizedOwner}_${normalizedName}`);
  }
}
