import { ValidationError } from '../../shared/errors/domain-errors.js';
import { RepoId, TeamId } from '../shared/index.js';

import { ScanRunId, CommitSha, QuestKey, QuestStatus } from './scan-value-objects.js';

export interface ScanRunProps {
  id: ScanRunId;
  teamId: TeamId;
  repoId: RepoId;
  commitSha: CommitSha;
  refName: string;
  providerRunId: string;
  runUrl: string;
  workflowVersion: string;
  scannedAt: Date;
  questResults: ReadonlyMap<string, QuestStatus>;
}

export class ScanRun {
  private constructor(private props: ScanRunProps) {}

  static create(input: ScanRunProps): ScanRun {
    const trimmedRefName = input.refName.trim();
    const trimmedProviderRunId = input.providerRunId.trim();
    const trimmedRunUrl = input.runUrl.trim();
    const trimmedWorkflowVersion = input.workflowVersion.trim();

    if (trimmedRefName.length === 0) {
      throw new ValidationError('Ref name cannot be empty');
    }

    if (trimmedProviderRunId.length === 0) {
      throw new ValidationError('Provider run ID cannot be empty');
    }

    if (trimmedRunUrl.length === 0) {
      throw new ValidationError('Run URL cannot be empty');
    }

    if (trimmedWorkflowVersion.length === 0) {
      throw new ValidationError('Workflow version cannot be empty');
    }

    return new ScanRun({
      ...input,
      refName: trimmedRefName,
      providerRunId: trimmedProviderRunId,
      runUrl: trimmedRunUrl,
      workflowVersion: trimmedWorkflowVersion,
    });
  }

  static reconstitute(props: ScanRunProps): ScanRun {
    return new ScanRun(props);
  }

  get id(): ScanRunId {
    return this.props.id;
  }

  get teamId(): TeamId {
    return this.props.teamId;
  }

  get repoId(): RepoId {
    return this.props.repoId;
  }

  get commitSha(): CommitSha {
    return this.props.commitSha;
  }

  get refName(): string {
    return this.props.refName;
  }

  get providerRunId(): string {
    return this.props.providerRunId;
  }

  get runUrl(): string {
    return this.props.runUrl;
  }

  get workflowVersion(): string {
    return this.props.workflowVersion;
  }

  get scannedAt(): Date {
    return this.props.scannedAt;
  }

  get questResults(): ReadonlyMap<string, QuestStatus> {
    return this.props.questResults;
  }

  getQuestStatus(questKey: QuestKey): QuestStatus | undefined {
    return this.props.questResults.get(questKey.value);
  }

  getPassedQuests(): QuestKey[] {
    const passed: QuestKey[] = [];
    for (const [key, status] of this.props.questResults) {
      if (status.isPass()) {
        passed.push(QuestKey.create(key));
      }
    }
    return passed;
  }

  getFailedQuests(): QuestKey[] {
    const failed: QuestKey[] = [];
    for (const [key, status] of this.props.questResults) {
      if (status.isFail()) {
        failed.push(QuestKey.create(key));
      }
    }
    return failed;
  }

  getTotalQuests(): number {
    return this.props.questResults.size;
  }
}
