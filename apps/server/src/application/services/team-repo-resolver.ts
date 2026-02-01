import { Repo } from '../../domain/repo/repo.js';
import { RepoId, RepoFullName, RepoUrl } from '../../domain/shared/repo-types.js';
import { TeamId, TeamSlug } from '../../domain/shared/team-types.js';
import { Team } from '../../domain/team/team.js';

import type { RepoRepository } from '../../domain/repo/repo-repository.js';
import type { TeamRepository } from '../../domain/team/team-repository.js';
import type { RepoMetadata } from '../dto/repo-metadata.dto.js';

/**
 * Result of resolving team and repo from metadata
 */
export interface TeamRepoResult {
  team: Team;
  repo: Repo;
}

/**
 * Service for resolving or auto-creating teams and repositories from metadata.
 * Implements the auto-creation logic for teams and repos during scan ingestion.
 */
export class TeamRepoResolver {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly repoRepository: RepoRepository,
  ) {}

  /**
   * Resolve team and repo from metadata, creating them if they don't exist.
   *
   * Auto-creation logic:
   * 1. Extract owner from repo metadata → derive team slug
   * 2. Find or create team using owner as team name/slug
   * 3. Find or create repo
   * 4. Link repo to team if not already linked
   *
   * @param metadata - Repository metadata from AI-Readiness report
   * @returns Team and Repo entities
   */
  async resolveFromMetadata(metadata: RepoMetadata): Promise<TeamRepoResult> {
    // Generate IDs based on naming convention
    const teamId = TeamRepoResolver.generateTeamId(metadata.owner);
    const repoId = TeamRepoResolver.generateRepoId(metadata.owner, metadata.name);
    const teamSlug = TeamSlug.create(metadata.owner.toLowerCase());

    // Try to find existing team by slug
    let team = await this.teamRepository.findBySlug(teamSlug);

    // Create team if it doesn't exist
    if (!team) {
      team = Team.create({
        id: teamId,
        name: metadata.owner,
        slug: teamSlug,
        repoIds: [],
      });
      await this.teamRepository.save(team);
    }

    // Try to find existing repo by full name
    const repoFullName = RepoFullName.create(metadata.fullName);
    let repo = await this.repoRepository.findByFullName(repoFullName);

    // Create repo if it doesn't exist
    if (!repo) {
      // Extract branch name (remove refs/heads/ prefix if present)
      const defaultBranch = metadata.refName.startsWith('refs/heads/')
        ? metadata.refName.substring('refs/heads/'.length)
        : metadata.refName;

      repo = Repo.create({
        id: repoId,
        provider: 'github',
        fullName: repoFullName,
        url: RepoUrl.create(metadata.url),
        defaultBranch,
        teamId,
        archived: false,
      });
      await this.repoRepository.save(repo);

      // Link repo to team (if not already linked)
      if (!team.hasRepo(repo.id)) {
        team.addRepo(repo.id);
        await this.teamRepository.save(team);
      }
    }

    return { team, repo };
  }

  /**
   * Generate team ID from owner name
   * Convention: team_{lowercase_owner}
   *
   * @param owner - Repository owner
   * @returns TeamId
   */
  static generateTeamId(owner: string): TeamId {
    const normalizedOwner = owner.toLowerCase();
    return TeamId.create(`team_${normalizedOwner}`);
  }

  /**
   * Generate repo ID from owner and repo name
   * Convention: repo_{lowercase_owner}_{lowercase_name}
   *
   * @param owner - Repository owner
   * @param name - Repository name
   * @returns RepoId
   */
  static generateRepoId(owner: string, name: string): RepoId {
    const normalizedOwner = owner.toLowerCase();
    const normalizedName = name.toLowerCase();
    return RepoId.create(`repo_${normalizedOwner}_${normalizedName}`);
  }
}
