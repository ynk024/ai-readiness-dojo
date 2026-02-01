import { ValidationError } from '../../shared/errors/domain-errors.js';
import { RepoId, RepoFullName, RepoUrl, TeamId } from '../shared/index.js';

export interface RepoProps {
  id: RepoId;
  provider: string;
  fullName: RepoFullName;
  url: RepoUrl;
  defaultBranch: string;
  teamId: TeamId;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Repo {
  private constructor(private props: RepoProps) {}

  static create(input: Omit<RepoProps, 'createdAt' | 'updatedAt'>): Repo {
    const trimmedProvider = input.provider.trim();
    const trimmedDefaultBranch = input.defaultBranch.trim();

    if (trimmedProvider.length === 0) {
      throw new ValidationError('Provider cannot be empty');
    }

    if (trimmedDefaultBranch.length === 0) {
      throw new ValidationError('Default branch cannot be empty');
    }

    const now = new Date();
    return new Repo({
      ...input,
      provider: trimmedProvider,
      defaultBranch: trimmedDefaultBranch,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: RepoProps): Repo {
    return new Repo(props);
  }

  get id(): RepoId {
    return this.props.id;
  }

  get provider(): string {
    return this.props.provider;
  }

  get fullName(): RepoFullName {
    return this.props.fullName;
  }

  get url(): RepoUrl {
    return this.props.url;
  }

  get defaultBranch(): string {
    return this.props.defaultBranch;
  }

  get teamId(): TeamId {
    return this.props.teamId;
  }

  get archived(): boolean {
    return this.props.archived;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  archive(): void {
    this.props.archived = true;
    this.props.updatedAt = new Date();
  }

  unarchive(): void {
    this.props.archived = false;
    this.props.updatedAt = new Date();
  }

  updateDefaultBranch(branch: string): void {
    const trimmedBranch = branch.trim();

    if (trimmedBranch.length === 0) {
      throw new ValidationError('Default branch cannot be empty');
    }

    this.props.defaultBranch = trimmedBranch;
    this.props.updatedAt = new Date();
  }
}
