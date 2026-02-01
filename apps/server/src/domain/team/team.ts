import { ValidationError, BusinessRuleViolationError } from '../../shared/errors/domain-errors.js';
import { RepoId, TeamId, TeamSlug } from '../shared/index.js';

export interface TeamProps {
  id: TeamId;
  name: string;
  slug: TeamSlug;
  repoIds: RepoId[];
  createdAt: Date;
  updatedAt: Date;
}

export class Team {
  private constructor(private props: TeamProps) {}

  static create(input: Omit<TeamProps, 'createdAt' | 'updatedAt'>): Team {
    const trimmedName = input.name.trim();

    if (trimmedName.length === 0) {
      throw new ValidationError('Team name cannot be empty');
    }

    const now = new Date();
    return new Team({
      ...input,
      name: trimmedName,
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

  get repoIds(): ReadonlyArray<RepoId> {
    return this.props.repoIds;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  addRepo(repoId: RepoId): void {
    if (this.hasRepo(repoId)) {
      throw new BusinessRuleViolationError(
        `Repo ${repoId.value} is already part of team ${this.id.value}`,
      );
    }

    this.props.repoIds.push(repoId);
    this.props.updatedAt = new Date();
  }

  removeRepo(repoId: RepoId): void {
    const index = this.props.repoIds.findIndex((id) => id.equals(repoId));
    if (index !== -1) {
      this.props.repoIds.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  hasRepo(repoId: RepoId): boolean {
    return this.props.repoIds.some((id) => id.equals(repoId));
  }

  getRepoCount(): number {
    return this.props.repoIds.length;
  }
}
