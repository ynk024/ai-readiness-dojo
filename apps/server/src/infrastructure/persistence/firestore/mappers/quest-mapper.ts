import { QuestId, QuestDetectionType } from '../../../../domain/quest/quest-value-objects.js';
import { Quest } from '../../../../domain/quest/quest.js';
import { ProgrammingLanguage } from '../../../../domain/shared/programming-language.js';

/**
 * Firestore Document Data for Quest
 *
 * Represents how Quest data is stored in Firestore.
 * This is decoupled from the domain model to allow independent evolution.
 */
export interface QuestFirestoreData {
  id: string;
  key: string;
  title: string;
  category: string;
  description: string;
  active: boolean;
  detectionType?: string; // Optional for backward compatibility
  levels: {
    level: number;
    description: string;
    condition: { type: string; min?: number };
  }[];
  languages?: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Quest Mapper
 *
 * Transforms between domain Quest entities and Firestore document data.
 * This keeps the domain model independent of persistence details.
 */

/**
 * Converts a Firestore document to a domain Quest entity
 * @param data Firestore document data
 * @returns Domain Quest entity
 */
export function questToDomain(data: QuestFirestoreData): Quest {
  // Map languages from string[] to ProgrammingLanguage[]
  const languages = data.languages
    ?.map((lang) => ProgrammingLanguage.fromString(lang))
    .filter((lang): lang is ProgrammingLanguage => lang !== null);

  // Map detectionType with backward compatibility (defaults to 'both' in Quest.reconstitute if missing)
  const detectionType = data.detectionType
    ? QuestDetectionType.create(data.detectionType)
    : undefined;

  return Quest.reconstitute({
    id: QuestId.create(data.id),
    key: data.key,
    title: data.title,
    category: data.category,
    description: data.description,
    active: data.active,
    detectionType,
    levels: data.levels.map((l) => ({
      level: l.level,
      description: l.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      condition: l.condition as any, // Cast to QuestCondition union - validated by domain model on creation
    })),
    languages,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  });
}

/**
 * Converts a domain Quest entity to Firestore document data
 * @param quest Domain Quest entity
 * @returns Firestore document data (with Date objects that Firestore will convert to Timestamps)
 */
export function questToFirestore(quest: Quest): {
  id: string;
  key: string;
  title: string;
  category: string;
  description: string;
  active: boolean;
  detectionType: string;
  levels: {
    level: number;
    description: string;
    condition: { type: string; min?: number };
  }[];
  languages?: string[];
  createdAt: Date;
  updatedAt: Date;
} {
  // Map languages from ProgrammingLanguage[] to string[]
  const languages = quest.languages?.map((lang) => lang.value);

  return {
    id: quest.id.value,
    key: quest.key,
    title: quest.title,
    category: quest.category,
    description: quest.description,
    active: quest.active,
    detectionType: quest.detectionType.value,
    levels: quest.levels,
    ...(languages && languages.length > 0 && { languages }),
    createdAt: quest.createdAt,
    updatedAt: quest.updatedAt,
  };
}

/**
 * Extracts the document ID from a domain Quest entity
 * @param quest Domain Quest entity
 * @returns Document ID
 */
export function questToDocumentId(quest: Quest): string {
  return quest.id.value;
}
