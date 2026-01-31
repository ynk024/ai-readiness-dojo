import { ScanRun } from '../entities/scan-run.js';
import { RepoId } from '../value-objects/repo-value-objects.js';
import { ScanRunId } from '../value-objects/scan-value-objects.js';

import { BaseRepository } from './base-repository.js';

export interface ScanRunRepository extends BaseRepository<ScanRun, ScanRunId> {
  findByRepoId(repoId: RepoId, limit?: number): Promise<ScanRun[]>;
  findLatestByRepoId(repoId: RepoId): Promise<ScanRun | null>;
}
