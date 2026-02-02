import { QuestId } from '../../domain/quest/quest-value-objects.js';
import { Quest } from '../../domain/quest/quest.js';

import { BaseRepository } from './base-repository.js';

export interface QuestRepository extends BaseRepository<Quest, QuestId> {
  findByKey(key: string): Promise<Quest | null>;
  findByCategory(category: string): Promise<Quest[]>;
  findActive(): Promise<Quest[]>;
}
