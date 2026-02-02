import { describe, expect, it } from 'vitest';

import { QuestId } from './quest-value-objects.js';
import { Quest, QuestProps } from './quest.js';

describe('Quest', () => {
  const validProps: Omit<QuestProps, 'createdAt' | 'updatedAt'> = {
    id: QuestId.create('quest-123'),
    key: 'test-quest',
    title: 'Test Quest',
    category: 'testing',
    description: 'A test quest',
    levels: [],
    active: true,
  };

  it('should create a valid quest', () => {
    const quest = Quest.create(validProps);
    expect(quest).toBeDefined();
    expect(quest.title).toBe('Test Quest');
    expect(quest.levels).toEqual([]);
  });

  it('should create a quest with levels', () => {
    const levels = [
      {
        level: 1,
        description: 'Basic',
        condition: { type: 'pass' } as const,
      },
      {
        level: 2,
        description: 'Advanced',
        condition: { type: 'count', min: 5 } as const,
      },
    ];

    const quest = Quest.create({
      ...validProps,
      levels,
    });

    expect(quest.levels).toHaveLength(2);
    expect(quest.levels[0]?.level).toBe(1);
    expect(quest.levels[1]?.condition).toEqual({ type: 'count', min: 5 });
  });

  it('should validate title length', () => {
    expect(() =>
      Quest.create({
        ...validProps,
        title: 'a'.repeat(101),
      }),
    ).toThrow(/Quest title must not exceed/);
  });
});
