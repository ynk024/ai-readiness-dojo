import { ValidationError } from '../../shared/errors/domain-errors.js';
import { ProgrammingLanguage } from '../shared/programming-language.js';

import { QuestId, QuestDetectionType } from './quest-value-objects.js';

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export type QuestCondition =
  | { type: 'pass' }
  | { type: 'count'; min: number }
  | { type: 'score'; min: number }
  | { type: 'exists' };

export interface QuestLevel {
  level: number;
  description: string;
  condition: QuestCondition;
}

export interface QuestProps {
  id: QuestId;
  key: string;
  title: string;
  category: string;
  description: string;
  levels: QuestLevel[];
  detectionType: QuestDetectionType;
  languages?: ProgrammingLanguage[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Quest {
  private constructor(private props: QuestProps) {}

  static create(
    input: Omit<QuestProps, 'createdAt' | 'updatedAt' | 'detectionType'> & {
      detectionType?: QuestDetectionType;
    },
  ): Quest {
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
      levels: input.levels,
      detectionType: input.detectionType ?? QuestDetectionType.both(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(
    props: Omit<QuestProps, 'detectionType'> & { detectionType?: QuestDetectionType },
  ): Quest {
    // Ensure backward compatibility: default detectionType to 'both' if not present
    const propsWithDefaults: QuestProps = {
      ...props,
      detectionType: props.detectionType ?? QuestDetectionType.both(),
    };
    return new Quest(propsWithDefaults);
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

  get levels(): QuestLevel[] {
    return [...this.props.levels];
  }

  get detectionType(): QuestDetectionType {
    return this.props.detectionType;
  }

  get languages(): ProgrammingLanguage[] | undefined {
    return this.props.languages ? [...this.props.languages] : undefined;
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

  /**
   * Check if this quest can be automatically detected via scans
   */
  canBeAutoDetected(): boolean {
    return this.props.detectionType.canAutoDetect();
  }

  /**
   * Check if this quest can be manually approved
   */
  canBeManuallyApproved(): boolean {
    return this.props.detectionType.canManuallyApprove();
  }

  /**
   * Check if this quest applies to a given programming language
   *
   * Business logic:
   * - Quests with no languages (undefined or empty array) are universal and apply to all repos
   * - Repos with no detected language (null) get all quests (including language-specific ones)
   * - Otherwise, quest applies if its languages include the repo's language
   *
   * @param language - The repo's programming language (or null if unknown)
   * @returns true if quest applies to this language
   */
  appliesToLanguage(language: ProgrammingLanguage | null): boolean {
    // Universal quest: no languages specified means applies to all repos
    if (!this.props.languages || this.props.languages.length === 0) {
      return true;
    }

    // Repo has no detected language: include all quests for now
    if (language === null) {
      return true;
    }

    // Check if quest's languages include the repo's language
    return this.props.languages.some((lang) => lang.equals(language));
  }
}
