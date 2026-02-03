/**
 * Response DTO for repository readiness
 */
export interface RepoReadinessResponseDto {
  repoId: string;
  teamId: string;
  computedFromScanRunId: string;
  updatedAt: string;
  summary: {
    totalQuests: number;
    completedQuests: number;
    completionPercentage: number;
  };
  quests: Record<
    string,
    {
      status: 'complete' | 'incomplete' | 'unknown';
      level: number;
      lastSeenAt: string;
      completionSource: 'automatic' | 'manual';
      manualApproval?: {
        approvedBy: string;
        approvedAt: string;
        revokedAt?: string;
      };
    }
  >;
}
