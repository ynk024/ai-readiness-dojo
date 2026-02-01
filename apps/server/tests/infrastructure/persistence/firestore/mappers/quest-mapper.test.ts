import { Timestamp } from 'firebase-admin/firestore';
import { describe, it, expect } from 'vitest';

import { QuestId } from '../../../../../src/domain/quest/quest-value-objects.js';
import { Quest } from '../../../../../src/domain/quest/quest.js';
import {
  questToDomain,
  questToFirestore,
  questToDocumentId,
  type QuestFirestoreData,
} from '../../../../../src/infrastructure/persistence/firestore/mappers/quest-mapper.js';

describe('QuestMapper', () => {
  describe('questToDomain', () => {
    it('should convert Firestore data to domain Quest entity', () => {
      const firestoreData: QuestFirestoreData = {
        id: 'quest_123',
        key: 'docs.agents_md_present',
        title: 'AGENTS.md exists',
        category: 'documentation',
        description: 'Checks if AGENTS.md file is present in repository',
        active: true,
        createdAt: Timestamp.fromDate(new Date('2025-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2025-01-02T00:00:00.000Z')),
      };

      const quest = questToDomain(firestoreData);

      expect(quest).toBeInstanceOf(Quest);
      expect(quest.id.value).toBe('quest_123');
      expect(quest.key).toBe('docs.agents_md_present');
      expect(quest.title).toBe('AGENTS.md exists');
      expect(quest.category).toBe('documentation');
      expect(quest.description).toBe('Checks if AGENTS.md file is present in repository');
      expect(quest.active).toBe(true);
      expect(quest.createdAt).toEqual(new Date('2025-01-01T00:00:00.000Z'));
      expect(quest.updatedAt).toEqual(new Date('2025-01-02T00:00:00.000Z'));
    });

    it('should handle inactive quests', () => {
      const firestoreData: QuestFirestoreData = {
        id: 'quest_456',
        key: 'test.key',
        title: 'Test Quest',
        category: 'test',
        description: 'Test description',
        active: false,
        createdAt: Timestamp.fromDate(new Date('2025-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2025-01-01T00:00:00.000Z')),
      };

      const quest = questToDomain(firestoreData);

      expect(quest.active).toBe(false);
    });

    it('should convert timestamps to Date objects correctly', () => {
      const createdDate = new Date('2025-01-15T10:30:45.123Z');
      const updatedDate = new Date('2025-01-15T14:20:30.456Z');

      const firestoreData: QuestFirestoreData = {
        id: 'quest_789',
        key: 'test.key',
        title: 'Test Quest',
        category: 'test',
        description: 'Test description',
        active: true,
        createdAt: Timestamp.fromDate(createdDate),
        updatedAt: Timestamp.fromDate(updatedDate),
      };

      const quest = questToDomain(firestoreData);

      expect(quest.createdAt).toEqual(createdDate);
      expect(quest.updatedAt).toEqual(updatedDate);
    });
  });

  describe('questToFirestore', () => {
    it('should convert domain Quest entity to Firestore data', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'docs.agents_md_present',
        title: 'AGENTS.md exists',
        category: 'documentation',
        description: 'Checks if AGENTS.md file is present in repository',
        active: true,
      });

      const firestoreData = questToFirestore(quest);

      expect(firestoreData.id).toBe('quest_123');
      expect(firestoreData.key).toBe('docs.agents_md_present');
      expect(firestoreData.title).toBe('AGENTS.md exists');
      expect(firestoreData.category).toBe('documentation');
      expect(firestoreData.description).toBe('Checks if AGENTS.md file is present in repository');
      expect(firestoreData.active).toBe(true);
      expect(firestoreData.createdAt).toBeInstanceOf(Date);
      expect(firestoreData.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle inactive quests', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_456'),
        key: 'test.key',
        title: 'Test Quest',
        category: 'test',
        description: 'Test description',
        active: false,
      });

      const firestoreData = questToFirestore(quest);

      expect(firestoreData.active).toBe(false);
    });

    it('should preserve Date objects for timestamps', () => {
      const createdAt = new Date('2025-01-15T10:30:45.123Z');
      const updatedAt = new Date('2025-01-15T14:20:30.456Z');

      const quest = Quest.reconstitute({
        id: QuestId.create('quest_789'),
        key: 'test.key',
        title: 'Test Quest',
        category: 'test',
        description: 'Test description',
        active: true,
        createdAt,
        updatedAt,
      });

      const firestoreData = questToFirestore(quest);

      expect(firestoreData.createdAt).toBe(createdAt);
      expect(firestoreData.updatedAt).toBe(updatedAt);
    });
  });

  describe('questToDocumentId', () => {
    it('should return the quest id value as document id', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: 'Test Quest',
        category: 'test',
        description: 'Test description',
        active: true,
      });

      const documentId = questToDocumentId(quest);

      expect(documentId).toBe('quest_123');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve all data through Firestore -> domain -> Firestore', () => {
      const originalFirestoreData: QuestFirestoreData = {
        id: 'quest_roundtrip',
        key: 'quality.coverage_threshold_met',
        title: 'Coverage threshold met',
        category: 'quality',
        description: 'Checks if test coverage meets defined threshold',
        active: true,
        createdAt: Timestamp.fromDate(new Date('2025-01-01T00:00:00.000Z')),
        updatedAt: Timestamp.fromDate(new Date('2025-01-02T00:00:00.000Z')),
      };

      // Convert to domain
      const quest = questToDomain(originalFirestoreData);

      // Convert back to Firestore format
      const reconvertedData = questToFirestore(quest);

      // Verify all fields match (timestamps as Date objects)
      expect(reconvertedData.id).toBe(originalFirestoreData.id);
      expect(reconvertedData.key).toBe(originalFirestoreData.key);
      expect(reconvertedData.title).toBe(originalFirestoreData.title);
      expect(reconvertedData.category).toBe(originalFirestoreData.category);
      expect(reconvertedData.description).toBe(originalFirestoreData.description);
      expect(reconvertedData.active).toBe(originalFirestoreData.active);
      expect(reconvertedData.createdAt).toEqual(originalFirestoreData.createdAt.toDate());
      expect(reconvertedData.updatedAt).toEqual(originalFirestoreData.updatedAt.toDate());
    });
  });
});
