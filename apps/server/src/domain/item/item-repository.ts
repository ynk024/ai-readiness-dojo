import { BaseRepository } from '../../shared/base-repository.js';

import { ItemId } from './item-value-objects.js';
import { Item } from './item.js';

export interface ItemRepository extends BaseRepository<Item, ItemId> {
  findByName(nameFragment: string): Promise<Item[]>;
  findLowStock(threshold: number): Promise<Item[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Item[]>;
}
