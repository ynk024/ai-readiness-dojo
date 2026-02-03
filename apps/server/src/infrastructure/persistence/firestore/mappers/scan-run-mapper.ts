import { ScanRun } from '../../../../domain/scan-run/scan-run.js';
import {
  CommitSha,
  ScanResult,
  ScanRunId,
} from '../../../../domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId } from '../../../../domain/shared/index.js';

/**
 * Firestore Document Data for ScanRun
 *
 * Represents how ScanRun data is stored in Firestore.
 * This is decoupled from the domain model to allow independent evolution.
 *
 * Note: questResults is stored as a Record<string, Record<string, unknown>> in Firestore
 * mapping quest key to the raw result data.
 */
export interface ScanRunFirestoreData {
  id: string;
  teamId: string;
  repoId: string;
  commitSha: string;
  refName: string;
  providerRunId: string;
  runUrl: string;
  workflowVersion: string;
  scannedAt: FirebaseFirestore.Timestamp;
  questResults: Record<string, Record<string, unknown>>;
}

/**
 * ScanRun Mapper
 *
 * Transforms between domain ScanRun entities and Firestore document data.
 * This keeps the domain model independent of persistence details.
 */

/**
 * Converts a Firestore document to a domain ScanRun entity
 * @param data Firestore document data
 * @returns Domain ScanRun entity
 */
export function scanRunToDomain(data: ScanRunFirestoreData): ScanRun {
  // Convert Record<string, Record<string, unknown>> to Map<string, ScanResult>
  const questResults = new Map<string, ScanResult>();
  for (const [key, value] of Object.entries(data.questResults)) {
    questResults.set(key, ScanResult.create(value));
  }

  return ScanRun.reconstitute({
    id: ScanRunId.create(data.id),
    teamId: TeamId.create(data.teamId),
    repoId: RepoId.create(data.repoId),
    commitSha: CommitSha.create(data.commitSha),
    refName: data.refName,
    providerRunId: data.providerRunId,
    runUrl: data.runUrl,
    workflowVersion: data.workflowVersion,
    scannedAt: data.scannedAt.toDate(),
    questResults,
  });
}

/**
 * Converts a domain ScanRun entity to Firestore document data
 * @param scanRun Domain ScanRun entity
 * @returns Firestore document data
 */
export function scanRunToFirestore(scanRun: ScanRun): Omit<ScanRunFirestoreData, 'scannedAt'> & {
  scannedAt: Date;
} {
  // Convert Map<string, ScanResult> to Record<string, Record<string, unknown>>
  const questResults: Record<string, Record<string, unknown>> = {};
  for (const [key, result] of scanRun.questResults) {
    questResults[key] = result.data;
  }

  return {
    id: scanRun.id.value,
    teamId: scanRun.teamId.value,
    repoId: scanRun.repoId.value,
    commitSha: scanRun.commitSha.value,
    refName: scanRun.refName,
    providerRunId: scanRun.providerRunId,
    runUrl: scanRun.runUrl,
    workflowVersion: scanRun.workflowVersion,
    scannedAt: scanRun.scannedAt,
    questResults,
  };
}

/**
 * Extracts the document ID from a domain ScanRun entity
 * @param scanRun Domain ScanRun entity
 * @returns Document ID
 */
export function scanRunToDocumentId(scanRun: ScanRun): string {
  return scanRun.id.value;
}
