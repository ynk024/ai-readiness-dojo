/**
 * Approve Quest DTOs (Data Transfer Objects)
 *
 * DTOs for manually approving quests via the API.
 */

/**
 * Request to manually approve a quest for a repository
 */
export interface ApproveQuestRequestDto {
  teamId: string; // Team ID that owns the repository
  questKey: string;
  level?: number; // Optional, defaults to 3 (gold) if not specified
  approvedBy: string; // User ID who is approving the quest
}

/**
 * Response after manually approving a quest
 */
export interface ApproveQuestResponseDto {
  repoId: string;
  teamId: string;
  questKey: string;
  level: number;
  approvedBy: string;
  approvedAt: string; // ISO 8601 date string
}

/**
 * Request to revoke a manual approval for a quest
 */
export interface RevokeQuestApprovalRequestDto {
  questKey: string;
}
