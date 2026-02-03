import { RepoReadiness } from '../../domain/repo-readiness/repo-readiness.js';
import { RepoId, TeamId, UserId } from '../../domain/shared/index.js';
import { BusinessRuleViolationError } from '../../shared/errors/domain-errors.js';

import type { QuestRepository } from '../ports/quest-repository.js';
import type { RepoReadinessRepository } from '../ports/repo-readiness-repository.js';
import type { TeamRepository } from '../ports/team-repository.js';

const DEFAULT_MANUAL_APPROVAL_LEVEL = 3;

export interface ApproveQuestManuallyInput {
  repoId: RepoId;
  teamId: TeamId;
  questKey: string;
  approvedBy: UserId;
  level?: number;
}

/**
 * Use case for manually approving a quest for a repository
 *
 * Orchestrates:
 * 1. Verify team exists
 * 2. Verify quest exists and allows manual approval
 * 3. Get or create readiness snapshot
 * 4. Apply manual approval
 * 5. Persist readiness snapshot
 */
export class ApproveQuestManuallyUseCase {
  constructor(
    private readonly questRepository: QuestRepository,
    private readonly teamRepository: TeamRepository,
    private readonly repoReadinessRepository: RepoReadinessRepository,
  ) {}

  /**
   * Execute the manual quest approval
   *
   * @param input - Approval input parameters
   * @returns Updated RepoReadiness entity
   */
  async execute(input: ApproveQuestManuallyInput): Promise<RepoReadiness> {
    // Step 1: Verify team exists
    const team = await this.teamRepository.findById(input.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Step 1.5: Verify repo belongs to team
    if (!team.hasRepo(input.repoId)) {
      throw new Error('Repo not found in team');
    }

    // Step 2: Verify quest exists and allows manual approval
    const quest = await this.questRepository.findByKey(input.questKey);
    if (!quest) {
      throw new Error('Quest not found');
    }

    if (!quest.canBeManuallyApproved()) {
      throw new BusinessRuleViolationError('Quest does not allow manual approval');
    }

    // Step 3: Get or create readiness snapshot
    let readiness = await this.repoReadinessRepository.findByRepoId(input.repoId);

    if (!readiness) {
      // Create new readiness snapshot if none exists
      readiness = RepoReadiness.createEmpty(input.repoId, input.teamId);
    }

    // Step 4: Apply manual approval (default to level 3 if not specified)
    const level = input.level ?? DEFAULT_MANUAL_APPROVAL_LEVEL;
    readiness.approveQuestManually(input.questKey, input.approvedBy, level);

    // Step 5: Persist readiness snapshot
    await this.repoReadinessRepository.save(readiness);

    return readiness;
  }
}
