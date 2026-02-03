import {
  ReadinessStatus,
  createQuestReadinessEntry,
} from '../../../../domain/repo-readiness/repo-readiness-value-objects.js';
import { RepoReadiness } from '../../../../domain/repo-readiness/repo-readiness.js';
import { ScanRunId } from '../../../../domain/scan-run/scan-value-objects.js';
import { RepoId, TeamId, UserId } from '../../../../domain/shared/index.js';

/**
 * Firestore Document Data for RepoReadiness
 *
 * Represents how RepoReadiness data is stored in Firestore.
 * Stored at: repos/{repoId}/readiness/latest
 */
export interface RepoReadinessFirestoreData {
  repoId: string;
  teamId: string;
  computedFromScanRunId: string;
  updatedAt: FirebaseFirestore.Timestamp;
  quests: Record<
    string,
    {
      status: string;
      level: number;
      lastSeenAt: FirebaseFirestore.Timestamp;
      completionSource?: string; // Optional for backward compatibility
      manualApproval?: {
        approvedBy: string;
        approvedAt: FirebaseFirestore.Timestamp;
        revokedAt?: FirebaseFirestore.Timestamp;
      };
    }
  >;
}

/**
 * RepoReadiness Mapper
 *
 * Transforms between domain RepoReadiness entities and Firestore document data.
 */

/**
 * Converts a Firestore document to a domain RepoReadiness entity
 */
export function repoReadinessToDomain(data: RepoReadinessFirestoreData): RepoReadiness {
  // Convert Record to Map with proper value objects
  const questsMap = new Map();
  for (const [key, value] of Object.entries(data.quests)) {
    const completionSource = value.completionSource ?? 'automatic'; // Default to automatic for backward compatibility
    const manualApproval = value.manualApproval
      ? {
          approvedBy: UserId.create(value.manualApproval.approvedBy),
          approvedAt: value.manualApproval.approvedAt.toDate(),
          revokedAt: value.manualApproval.revokedAt?.toDate(),
        }
      : undefined;

    const entry = createQuestReadinessEntry(
      ReadinessStatus.create(value.status),
      value.level,
      value.lastSeenAt.toDate(),
      completionSource as 'automatic' | 'manual',
      manualApproval,
    );
    questsMap.set(key, entry);
  }

  return RepoReadiness.reconstitute({
    repoId: RepoId.create(data.repoId),
    teamId: TeamId.create(data.teamId),
    computedFromScanRunId: ScanRunId.create(data.computedFromScanRunId),
    updatedAt: data.updatedAt.toDate(),
    quests: questsMap,
  });
}

/**
 * Converts a domain RepoReadiness entity to Firestore document data
 */
export function repoReadinessToFirestore(readiness: RepoReadiness): Omit<
  RepoReadinessFirestoreData,
  'updatedAt' | 'quests'
> & {
  updatedAt: Date;
  quests: Record<
    string,
    {
      status: string;
      level: number;
      lastSeenAt: Date;
      completionSource: string;
      manualApproval?: {
        approvedBy: string;
        approvedAt: Date;
        revokedAt?: Date;
      };
    }
  >;
} {
  // Convert Map to Record for Firestore
  const questsRecord: Record<
    string,
    {
      status: string;
      level: number;
      lastSeenAt: Date;
      completionSource: string;
      manualApproval?: {
        approvedBy: string;
        approvedAt: Date;
        revokedAt?: Date;
      };
    }
  > = {};

  for (const [key, entry] of readiness.quests) {
    questsRecord[key] = {
      status: entry.status.value,
      level: entry.level,
      lastSeenAt: entry.lastSeenAt,
      completionSource: entry.completionSource,
      ...(entry.manualApproval && {
        manualApproval: {
          approvedBy: entry.manualApproval.approvedBy.value,
          approvedAt: entry.manualApproval.approvedAt,
          ...(entry.manualApproval.revokedAt && { revokedAt: entry.manualApproval.revokedAt }),
        },
      }),
    };
  }

  return {
    repoId: readiness.repoId.value,
    teamId: readiness.teamId.value,
    computedFromScanRunId: readiness.computedFromScanRunId.value,
    updatedAt: readiness.updatedAt,
    quests: questsRecord,
  };
}

/**
 * Extracts the document ID from a domain RepoReadiness entity
 * For readiness, we use a fixed document ID 'latest' in the subcollection
 */
export function repoReadinessToDocumentId(): string {
  return 'latest';
}
