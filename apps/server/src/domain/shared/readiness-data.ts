import { ScanRunId, ScanResult } from '../scan-run/scan-value-objects.js';

import { RepoId } from './repo-types.js';
import { TeamId } from './team-types.js';

/**
 * Lightweight definition of a quest needed for readiness computation
 * Decoupled from the full Quest aggregate
 */
export interface QuestDefinition {
  key: string;
  levels: {
    level: number;
    condition:
      | { type: 'pass' }
      | { type: 'count'; min: number }
      | { type: 'score'; min: number }
      | { type: 'exists' };
  }[];
}

/**
 * Summary of a scan run needed for readiness computation
 * Decoupled from the full ScanRun aggregate
 */
export interface ScanRunSummary {
  id: ScanRunId;
  repoId: RepoId;
  teamId: TeamId;
  scannedAt: Date;
  questResults: ReadonlyMap<string, ScanResult>;
}
