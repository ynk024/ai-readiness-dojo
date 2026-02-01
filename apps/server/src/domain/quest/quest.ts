import { ValidationError } from '../../shared/errors/domain-errors.js';

import { QuestId } from './quest-value-objects.js';

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export interface QuestProps {
  id: QuestId;
  key: string;
  title: string;
  category: string;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Quest {
  private constructor(private props: QuestProps) {}

  static create(input: Omit<QuestProps, 'createdAt' | 'updatedAt'>): Quest {
    const trimmedKey = input.key.trim();
    const trimmedTitle = input.title.trim();
    const trimmedCategory = input.category.trim();
    const trimmedDescription = input.description.trim();

    if (trimmedKey.length === 0) {
      throw new ValidationError('Quest key cannot be empty');
    }

    if (trimmedTitle.length === 0) {
      throw new ValidationError('Quest title cannot be empty');
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      throw new ValidationError(`Quest title must not exceed ${MAX_TITLE_LENGTH} characters`);
    }

    if (trimmedCategory.length === 0) {
      throw new ValidationError('Quest category cannot be empty');
    }

    if (trimmedDescription.length === 0) {
      throw new ValidationError('Quest description cannot be empty');
    }

    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      throw new ValidationError(
        `Quest description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    const now = new Date();
    return new Quest({
      ...input,
      key: trimmedKey,
      title: trimmedTitle,
      category: trimmedCategory,
      description: trimmedDescription,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: QuestProps): Quest {
    return new Quest(props);
  }

  get id(): QuestId {
    return this.props.id;
  }

  get key(): string {
    return this.props.key;
  }

  get title(): string {
    return this.props.title;
  }

  get category(): string {
    return this.props.category;
  }

  get description(): string {
    return this.props.description;
  }

  get active(): boolean {
    return this.props.active;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  activate(): void {
    this.props.active = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.active = false;
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    const trimmedDescription = description.trim();

    if (trimmedDescription.length === 0) {
      throw new ValidationError('Quest description cannot be empty');
    }

    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      throw new ValidationError(
        `Quest description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    this.props.description = trimmedDescription;
    this.props.updatedAt = new Date();
  }
}
