import { BaseRepository } from '../../shared/base-repository.js';

import { QuestId } from './quest-value-objects.js';
import { Quest } from './quest.js';

export interface QuestRepository extends BaseRepository<Quest, QuestId> {
  findByKey(key: string): Promise<Quest | null>;
  findByCategory(category: string): Promise<Quest[]>;
  findActive(): Promise<Quest[]>;
}
