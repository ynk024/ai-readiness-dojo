import { describe, it, expect } from 'vitest';

import { QuestId } from '../../../src/domain/quest/quest-value-objects.js';
import { Quest } from '../../../src/domain/quest/quest.js';
import { ValidationError } from '../../../src/shared/errors/domain-errors.js';

describe('Quest Entity', () => {
  describe('create', () => {
    it('should create a new quest with valid data', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'docs.agents_md_present',
        title: 'AGENTS.md exists',
        category: 'documentation',
        description: 'Checks if AGENTS.md file is present in repository',
        active: true,
        levels: [],
      });

      expect(quest.id.value).toBe('quest_123');
      expect(quest.key).toBe('docs.agents_md_present');
      expect(quest.title).toBe('AGENTS.md exists');
      expect(quest.category).toBe('documentation');
      expect(quest.description).toBe('Checks if AGENTS.md file is present in repository');
      expect(quest.active).toBe(true);
      expect(quest.createdAt).toBeInstanceOf(Date);
      expect(quest.updatedAt).toBeInstanceOf(Date);
    });

    it('should trim key, title, category, and description', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: '  docs.agents_md_present  ',
        title: '  AGENTS.md exists  ',
        category: '  documentation  ',
        description: '  Checks if AGENTS.md file is present  ',
        active: true,
        levels: [],
      });

      expect(quest.key).toBe('docs.agents_md_present');
      expect(quest.title).toBe('AGENTS.md exists');
      expect(quest.category).toBe('documentation');
      expect(quest.description).toBe('Checks if AGENTS.md file is present');
    });

    it('should throw ValidationError for empty key', () => {
      expect(() => {
        Quest.create({
          id: QuestId.create('quest_123'),
          key: '',
          title: 'Test',
          category: 'test',
          description: 'Test description',
          active: true,
          levels: [],
        });
      }).toThrow(ValidationError);
      expect(() => {
        Quest.create({
          id: QuestId.create('quest_123'),
          key: '',
          title: 'Test',
          category: 'test',
          description: 'Test description',
          active: true,
          levels: [],
        });
      }).toThrow('Quest key cannot be empty');
    });

    it('should throw ValidationError for whitespace-only key', () => {
      expect(() => {
        Quest.create({
          id: QuestId.create('quest_123'),
          key: '   ',
          title: 'Test',
          category: 'test',
          description: 'Test description',
          active: true,
          levels: [],
        });
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty title', () => {
      expect(() => {
        Quest.create({
          id: QuestId.create('quest_123'),
          key: 'test.key',
          title: '',
          category: 'test',
          description: 'Test description',
          active: true,
          levels: [],
        });
      }).toThrow('Quest title cannot be empty');
    });

    it('should throw ValidationError for whitespace-only title', () => {
      expect(() =>
        Quest.create({
          id: QuestId.create('quest_123'),
          key: 'test.key',
          title: '   ',
          category: 'test',
          description: 'Test description',
          active: true,
          levels: [],
        }),
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty category', () => {
      expect(() =>
        Quest.create({
          id: QuestId.create('quest_123'),
          key: 'test.key',
          title: 'Test',
          category: '',
          description: 'Test description',
          active: true,
          levels: [],
        }),
      ).toThrow('Quest category cannot be empty');
    });

    it('should throw ValidationError for whitespace-only category', () => {
      expect(() =>
        Quest.create({
          id: QuestId.create('quest_123'),
          key: 'test.key',
          title: 'Test',
          category: '   ',
          description: 'Test description',
          active: true,
          levels: [],
        }),
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty description', () => {
      expect(() =>
        Quest.create({
          id: QuestId.create('quest_123'),
          key: 'test.key',
          title: 'Test',
          category: 'test',
          description: '',
          active: true,
          levels: [],
        }),
      ).toThrow('Quest description cannot be empty');
    });

    it('should throw ValidationError for whitespace-only description', () => {
      expect(() =>
        Quest.create({
          id: QuestId.create('quest_123'),
          key: 'test.key',
          title: 'Test',
          category: 'test',
          description: '   ',
          active: true,
          levels: [],
        }),
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError for title exceeding 100 characters', () => {
      const longTitle = 'a'.repeat(101);
      expect(() =>
        Quest.create({
          id: QuestId.create('quest_123'),
          key: 'test.key',
          title: longTitle,
          category: 'test',
          description: 'Test description',
          active: true,
          levels: [],
        }),
      ).toThrow('Quest title must not exceed 100 characters');
    });

    it('should throw ValidationError for description exceeding 500 characters', () => {
      const longDescription = 'a'.repeat(501);
      expect(() =>
        Quest.create({
          id: QuestId.create('quest_123'),
          key: 'test.key',
          title: 'Test',
          category: 'test',
          description: longDescription,
          active: true,
          levels: [],
        }),
      ).toThrow('Quest description must not exceed 500 characters');
    });

    it('should accept title at max length (100 characters)', () => {
      const maxTitle = 'a'.repeat(100);
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: maxTitle,
        category: 'test',
        description: 'Test description',
        active: true,
        levels: [],
      });

      expect(quest.title).toBe(maxTitle);
    });

    it('should accept description at max length (500 characters)', () => {
      const maxDescription = 'a'.repeat(500);
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: 'Test',
        category: 'test',
        description: maxDescription,
        active: true,
        levels: [],
      });

      expect(quest.description).toBe(maxDescription);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a quest from persistence data', () => {
      const createdAt = new Date('2025-01-01T00:00:00Z');
      const updatedAt = new Date('2025-01-02T00:00:00Z');

      const quest = Quest.reconstitute({
        id: QuestId.create('quest_123'),
        key: 'docs.agents_md_present',
        title: 'AGENTS.md exists',
        category: 'documentation',
        description: 'Checks if AGENTS.md file is present',
        active: true,
        levels: [],
        createdAt,
        updatedAt,
      });

      expect(quest.id.value).toBe('quest_123');
      expect(quest.key).toBe('docs.agents_md_present');
      expect(quest.title).toBe('AGENTS.md exists');
      expect(quest.category).toBe('documentation');
      expect(quest.description).toBe('Checks if AGENTS.md file is present');
      expect(quest.active).toBe(true);
      expect(quest.createdAt).toBe(createdAt);
      expect(quest.updatedAt).toBe(updatedAt);
    });
  });

  describe('activate', () => {
    it('should set active to true and update timestamp', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: 'Test',
        category: 'test',
        description: 'Test description',
        active: false,
        levels: [],
      });

      const originalUpdatedAt = quest.updatedAt;

      // Wait a bit to ensure timestamp changes
      const beforeActivate = new Date();
      quest.activate();

      expect(quest.active).toBe(true);
      expect(quest.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeActivate.getTime());
      expect(quest.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('deactivate', () => {
    it('should set active to false and update timestamp', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: 'Test',
        category: 'test',
        description: 'Test description',
        active: true,
        levels: [],
      });

      const originalUpdatedAt = quest.updatedAt;

      const beforeDeactivate = new Date();
      quest.deactivate();

      expect(quest.active).toBe(false);
      expect(quest.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeDeactivate.getTime());
      expect(quest.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('updateDescription', () => {
    it('should update description and timestamp', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: 'Test',
        category: 'test',
        description: 'Original description',
        active: true,
        levels: [],
      });

      const originalUpdatedAt = quest.updatedAt;

      const beforeUpdate = new Date();
      quest.updateDescription('Updated description');

      expect(quest.description).toBe('Updated description');
      expect(quest.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(quest.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should trim updated description', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: 'Test',
        category: 'test',
        description: 'Original description',
        active: true,
        levels: [],
      });

      quest.updateDescription('  Updated description  ');

      expect(quest.description).toBe('Updated description');
    });

    it('should throw ValidationError for empty description', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: 'Test',
        category: 'test',
        description: 'Original description',
        active: true,
        levels: [],
      });

      expect(() => {
        quest.updateDescription('');
      }).toThrow('Quest description cannot be empty');
    });

    it('should throw ValidationError for whitespace-only description', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: 'Test',
        category: 'test',
        description: 'Original description',
        active: true,
        levels: [],
      });

      expect(() => {
        quest.updateDescription('   ');
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError for description exceeding 500 characters', () => {
      const quest = Quest.create({
        id: QuestId.create('quest_123'),
        key: 'test.key',
        title: 'Test',
        category: 'test',
        description: 'Original description',
        active: true,
        levels: [],
      });

      const longDescription = 'a'.repeat(501);
      expect(() => {
        quest.updateDescription(longDescription);
      }).toThrow('Quest description must not exceed 500 characters');
    });
  });
});
