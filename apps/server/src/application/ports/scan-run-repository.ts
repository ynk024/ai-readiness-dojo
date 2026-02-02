import { ScanRun } from '../../domain/scan-run/scan-run.js';
import { ScanRunId } from '../../domain/scan-run/scan-value-objects.js';
import { RepoId } from '../../domain/shared/index.js';

import { BaseRepository } from './base-repository.js';

export interface ScanRunRepository extends BaseRepository<ScanRun, ScanRunId> {
  findByRepoId(repoId: RepoId, limit?: number): Promise<ScanRun[]>;
  findLatestByRepoId(repoId: RepoId): Promise<ScanRun | null>;
}
