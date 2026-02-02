import { ValidationError, BusinessRuleViolationError } from '../../shared/errors/domain-errors.js';
import { RepoId, RepoFullName } from '../shared/repo-types.js';
import { TeamId, TeamSlug } from '../shared/team-types.js';

import { RepoEntity, type RepoEntityProps } from './repo-entity.js';

export type { RepoEntityProps };
export { RepoEntity };

export interface TeamProps {
  id: TeamId;
  name: string;
  slug: TeamSlug;
  repos: RepoEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class Team {
  private constructor(private props: TeamProps) {}

  static create(
    input: Omit<TeamProps, 'createdAt' | 'updatedAt' | 'repos'> & { repos?: never[] },
  ): Team {
    const trimmedName = input.name.trim();

    if (trimmedName.length === 0) {
      throw new ValidationError('Team name cannot be empty');
    }

    const now = new Date();
    return new Team({
      ...input,
      name: trimmedName,
      repos: input.repos ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: TeamProps): Team {
    return new Team(props);
  }

  get id(): TeamId {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): TeamSlug {
    return this.props.slug;
  }

  get repos(): ReadonlyArray<RepoEntity> {
    return this.props.repos;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  addRepo(input: Omit<RepoEntityProps, 'createdAt' | 'updatedAt'>): RepoEntity {
    if (this.hasRepo(input.id)) {
      throw new BusinessRuleViolationError(
        `Repo ${input.id.value} is already part of team ${this.id.value}`,
      );
    }

    const repo = RepoEntity.create(input);
    this.props.repos.push(repo);
    this.props.updatedAt = new Date();
    return repo;
  }

  removeRepo(repoId: RepoId): void {
    const index = this.props.repos.findIndex((repo) => repo.id.equals(repoId));
    if (index !== -1) {
      this.props.repos.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  getRepo(repoId: RepoId): RepoEntity | undefined {
    return this.props.repos.find((repo) => repo.id.equals(repoId));
  }

  getRepoByFullName(fullName: RepoFullName): RepoEntity | undefined {
    return this.props.repos.find((repo) => repo.fullName.equals(fullName));
  }

  getActiveRepos(): RepoEntity[] {
    return this.props.repos.filter((repo) => !repo.archived);
  }

  archiveRepo(repoId: RepoId): void {
    const repo = this.getRepo(repoId);
    if (repo) {
      repo.archive();
      this.props.updatedAt = new Date();
    }
  }

  hasRepo(repoId: RepoId): boolean {
    return this.props.repos.some((repo) => repo.id.equals(repoId));
  }

  getRepoCount(): number {
    return this.props.repos.length;
  }
}
