import { QuestId } from '../../../../domain/quest/quest-value-objects.js';
import { Quest } from '../../../../domain/quest/quest.js';

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
  levels: {
    level: number;
    description: string;
    condition: { type: string; min?: number };
  }[];
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
  return Quest.reconstitute({
    id: QuestId.create(data.id),
    key: data.key,
    title: data.title,
    category: data.category,
    description: data.description,
    active: data.active,
    levels: data.levels.map((l) => ({
      level: l.level,
      description: l.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      condition: l.condition as any, // Cast to QuestCondition union - validated by domain model on creation
    })),
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
  levels: {
    level: number;
    description: string;
    condition: { type: string; min?: number };
  }[];
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: quest.id.value,
    key: quest.key,
    title: quest.title,
    category: quest.category,
    description: quest.description,
    active: quest.active,
    levels: quest.levels,
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
