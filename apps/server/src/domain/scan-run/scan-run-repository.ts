import { BaseRepository } from '../../shared/base-repository.js';
import { RepoId } from '../shared/index.js';

import { ScanRun } from './scan-run.js';
import { ScanRunId } from './scan-value-objects.js';

export interface ScanRunRepository extends BaseRepository<ScanRun, ScanRunId> {
  findByRepoId(repoId: RepoId, limit?: number): Promise<ScanRun[]>;
  findLatestByRepoId(repoId: RepoId): Promise<ScanRun | null>;
}
