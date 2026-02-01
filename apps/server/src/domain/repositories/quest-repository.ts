import { Quest } from '../entities/quest.js';
import { QuestId } from '../value-objects/quest-value-objects.js';

import { BaseRepository } from './base-repository.js';

export interface QuestRepository extends BaseRepository<Quest, QuestId> {
  findByKey(key: string): Promise<Quest | null>;
  findByCategory(category: string): Promise<Quest[]>;
  findActive(): Promise<Quest[]>;
}
