import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { QuestId } from '../../../src/domain/quest/quest-value-objects.js';
import { Quest } from '../../../src/domain/quest/quest.js';
import { FirestoreQuestRepository } from '../../../src/infrastructure/persistence/firestore/repositories/firestore-quest-repository.js';
import {
  clearCollection,
  createTestFirestoreClient,
  documentExists,
  teardownTestFirestore,
  type IsolatedFirestoreClient,
} from '../../helpers/firestore-test-helper.js';

/**
 * Firestore Quest Repository Integration Tests
 *
 * These tests verify the Firestore repository implementation using the emulator.
 * Prerequisites:
 * - Firestore emulator must be running on localhost:8080
 * - Run: pnpm emulator:start (in another terminal)
 */

describe('FirestoreQuestRepository - Integration Tests', () => {
  let repository: FirestoreQuestRepository;
  let testFirestore: IsolatedFirestoreClient;

  beforeAll(() => {
    testFirestore = createTestFirestoreClient('quest_repo_test');
    repository = new FirestoreQuestRepository(testFirestore);
  });

  afterEach(async () => {
    // Clear test data between tests in the same file
    await clearCollection('quests', testFirestore);
  });

  afterAll(async () => {
    await teardownTestFirestore(testFirestore);
  });

  describe('save() - Create Quest', () => {
    it('should save a new quest to Firestore', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'docs.agents_md_present',
        title: 'AGENTS.md exists',
        category: 'documentation',
        description: 'Checks if AGENTS.md file is present in repository',
        active: true,
        levels: [],
      });

      const savedQuest = await repository.save(quest);

      expect(savedQuest.id.value).toBe('quest_123');
      expect(savedQuest.key).toBe('docs.agents_md_present');
      expect(savedQuest.title).toBe('AGENTS.md exists');
      expect(savedQuest.category).toBe('documentation');
      expect(savedQuest.description).toBe('Checks if AGENTS.md file is present in repository');
      expect(savedQuest.active).toBe(true);

      const exists = await documentExists('quests', 'quest_123', testFirestore);
      expect(exists).toBe(true);
    });

    it('should save an inactive quest', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_456'),
        key: 'test.deprecated_check',
        title: 'Deprecated Check',
        category: 'test',
        description: 'A deprecated test check',
        active: false,
        levels: [],
      });

      const savedQuest = await repository.save(quest);

      expect(savedQuest.active).toBe(false);
    });

    it('should update an existing quest when saved again', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_789'),
        key: 'quality.test_check',
        title: 'Original Title',
        category: 'quality',
        description: 'Original description',
        active: true,
        levels: [],
      });

      await repository.save(quest);

      // Update the quest
      quest.updateDescription('Updated description');
      quest.deactivate();

      const updatedQuest = await repository.save(quest);

      expect(updatedQuest.description).toBe('Updated description');
      expect(updatedQuest.active).toBe(false);
    });
  });

  describe('findById()', () => {
    it('should find a quest by id', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_find'),
        key: 'sast.codeql_present',
        title: 'CodeQL enabled',
        category: 'sast',
        description: 'Checks if CodeQL SAST scanning is configured',
        active: true,
        levels: [],
      });

      await repository.save(quest);

      const foundQuest = await repository.findById(QuestId.create('quest_find'));

      expect(foundQuest).not.toBeNull();
      expect(foundQuest?.id.value).toBe('quest_find');
      expect(foundQuest?.key).toBe('sast.codeql_present');
      expect(foundQuest?.title).toBe('CodeQL enabled');
    });

    it('should return null when quest not found', async () => {
      const foundQuest = await repository.findById(QuestId.create('nonexistent'));

      expect(foundQuest).toBeNull();
    });
  });

  describe('findByKey()', () => {
    it('should find a quest by key', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_key_search'),
        key: 'formatters.javascript.prettier_present',
        title: 'Prettier configured',
        category: 'formatters',
        description: 'Checks if Prettier formatter is configured',
        active: true,
        levels: [],
      });

      await repository.save(quest);

      const foundQuest = await repository.findByKey('formatters.javascript.prettier_present');

      expect(foundQuest).not.toBeNull();
      expect(foundQuest?.id.value).toBe('quest_key_search');
      expect(foundQuest?.key).toBe('formatters.javascript.prettier_present');
    });

    it('should return null when key not found', async () => {
      const foundQuest = await repository.findByKey('nonexistent.key');

      expect(foundQuest).toBeNull();
    });
  });

  describe('findByCategory()', () => {
    it('should find all quests in a category', async () => {
      const quest1 = Quest.create({
        id: QuestId.create('quest_doc_1'),
        key: 'docs.agents_md_present',
        title: 'AGENTS.md exists',
        category: 'documentation',
        description: 'Checks if AGENTS.md file is present',
        active: true,
        levels: [],
      });

      const quest2 = Quest.create({
        id: QuestId.create('quest_doc_2'),
        key: 'docs.skill_md_count',
        title: 'Skills documented',
        category: 'documentation',
        description: 'Checks if skill markdown files exist',
        active: true,
        levels: [],
      });

      const quest3 = Quest.create({
        id: QuestId.create('quest_quality_1'),
        key: 'quality.coverage_available',
        title: 'Coverage reporting',
        category: 'quality',
        description: 'Checks if test coverage data is available',
        active: true,
        levels: [],
      });

      await repository.save(quest1);
      await repository.save(quest2);
      await repository.save(quest3);

      const documentationQuests = await repository.findByCategory('documentation');

      expect(documentationQuests).toHaveLength(2);
      expect(documentationQuests[0]?.category).toBe('documentation');
      expect(documentationQuests[1]?.category).toBe('documentation');
    });

    it('should return empty array when category has no quests', async () => {
      const quests = await repository.findByCategory('nonexistent-category');

      expect(quests).toEqual([]);
    });
  });

  describe('findActive()', () => {
    it('should find only active quests', async () => {
      const activeQuest1 = Quest.create({
        id: QuestId.create('quest_active_1'),
        key: 'test.active_1',
        title: 'Active Quest 1',
        category: 'test',
        description: 'Active quest description 1',
        active: true,
        levels: [],
      });

      const activeQuest2 = Quest.create({
        id: QuestId.create('quest_active_2'),
        key: 'test.active_2',
        title: 'Active Quest 2',
        category: 'test',
        description: 'Active quest description 2',
        active: true,
        levels: [],
      });

      const inactiveQuest = Quest.create({
        id: QuestId.create('quest_inactive'),
        key: 'test.inactive',
        title: 'Inactive Quest',
        category: 'test',
        description: 'Inactive quest description',
        active: false,
        levels: [],
      });

      await repository.save(activeQuest1);
      await repository.save(activeQuest2);
      await repository.save(inactiveQuest);

      const activeQuests = await repository.findActive();

      expect(activeQuests).toHaveLength(2);
      for (const quest of activeQuests) {
        expect(quest.active).toBe(true);
      }
    });

    it('should return empty array when no active quests exist', async () => {
      const inactiveQuest = Quest.create({
        id: QuestId.create('quest_inactive'),
        key: 'test.inactive',
        title: 'Inactive Quest',
        category: 'test',
        description: 'Inactive quest description',
        active: false,
        levels: [],
      });

      await repository.save(inactiveQuest);

      const activeQuests = await repository.findActive();

      expect(activeQuests).toEqual([]);
    });
  });

  describe('findAll()', () => {
    it('should return all quests', async () => {
      const quest1 = Quest.create({
        id: QuestId.create('quest_all_1'),
        key: 'test.all_1',
        title: 'Quest 1',
        category: 'test',
        description: 'Quest 1 description',
        active: true,
        levels: [],
      });

      const quest2 = Quest.create({
        id: QuestId.create('quest_all_2'),
        key: 'test.all_2',
        title: 'Quest 2',
        category: 'test',
        description: 'Quest 2 description',
        active: false,
        levels: [],
      });

      await repository.save(quest1);
      await repository.save(quest2);

      const allQuests = await repository.findAll();

      expect(allQuests).toHaveLength(2);
    });

    it('should return empty array when no quests exist', async () => {
      const allQuests = await repository.findAll();

      expect(allQuests).toEqual([]);
    });
  });

  describe('delete()', () => {
    it('should delete a quest by id', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_to_delete'),
        key: 'test.delete',
        title: 'Quest to Delete',
        category: 'test',
        description: 'This quest will be deleted',
        active: true,
        levels: [],
      });

      await repository.save(quest);

      let exists = await documentExists('quests', 'quest_to_delete', testFirestore);
      expect(exists).toBe(true);

      await repository.delete(QuestId.create('quest_to_delete'));

      exists = await documentExists('quests', 'quest_to_delete', testFirestore);
      expect(exists).toBe(false);
    });

    it('should throw error when deleting non-existent quest', async () => {
      await expect(repository.delete(QuestId.create('nonexistent'))).rejects.toThrow();
    });
  });

  describe('exists()', () => {
    it('should return true when quest exists', async () => {
      const quest = Quest.create({
        id: QuestId.create('quest_exists'),
        key: 'test.exists',
        title: 'Quest Exists',
        category: 'test',
        description: 'This quest exists',
        active: true,
        levels: [],
      });

      await repository.save(quest);

      const exists = await repository.exists(QuestId.create('quest_exists'));

      expect(exists).toBe(true);
    });

    it('should return false when quest does not exist', async () => {
      const exists = await repository.exists(QuestId.create('nonexistent'));

      expect(exists).toBe(false);
    });
  });
});
