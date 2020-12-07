import azdev = require('azure-devops-node-api');
import ga = require('azure-devops-node-api/GitApi');
import { IdentityRef } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import { GraphUser } from 'azure-devops-node-api/interfaces/GraphInterfaces';
import gi = require('azure-devops-node-api/interfaces/GitInterfaces');
import tl = require('azure-pipelines-task-lib/task');
import { OrganizationalWebApi } from '../api/OrganizationalWebApi';
import { IGraphApi } from '../api/GraphApi';
import { IMemberEntitlementApi } from '../api/MemberEntitlementApi';
import { UserEntitlement } from '../api/interfaces/MemberEntitlementInterfaces';

class createAzureGitPullRequest {
  private organization: string;
  private repositoryId: string;
  private projectId: string;
  private connection: azdev.WebApi;
  private shouldCreateMergeBranch: boolean;
  private mergeBranchName: string | undefined;
  private title: string | undefined;
  private sourceRefName: string | undefined;
  private targetRefName: string | undefined;
  private isDraft: boolean;
  private description: string | undefined;
  private reviewers: string | undefined;
  private setAutoComplete: boolean;
  private autoCompleteSetBy: string | undefined;
  private transitionWorkItems: boolean;
  private mergeCommitMessage: string | undefined;
  private deleteSourceBranch: boolean;
  private bypassReason: string | undefined;
  private bypassPolicy: boolean;
  private mergeStrategy: gi.GitPullRequestMergeStrategy;
  private accessToken: string;

  private readonly cache: {
    users?: GraphUser[],
    graph?: IGraphApi,
    memberEntitlement?: IMemberEntitlementApi
  } = {};

  constructor() {
    this.organization = tl.getInput('organization', true)!;
    this.projectId = tl.getInput('projectId', true)!;
    this.repositoryId = tl.getInput('repositoryId', true)!;
    this.sourceRefName = tl.getInput('sourceRefName', true);
    this.targetRefName = tl.getInput('targetRefName', true);
    this.title = tl.getInput('title');
    this.description = tl.getInput('description');
    this.isDraft = tl.getBoolInput('isDraft');
    this.shouldCreateMergeBranch = tl.getBoolInput('createMergeBranch');
    this.mergeBranchName = tl.getInput('mergeBranchName', this.shouldCreateMergeBranch);
    this.reviewers = tl.getInput('reviewers');
    this.setAutoComplete = tl.getBoolInput('setAutoComplete');
    this.autoCompleteSetBy = tl.getInput('autoCompleteSetBy', this.setAutoComplete);
    this.bypassPolicy = tl.getBoolInput('byPassPolicy');
    this.bypassReason = tl.getInput('byPassReason');
    this.deleteSourceBranch = tl.getBoolInput('deleteSourceBranch');
    this.mergeCommitMessage = tl.getInput('mergeCommitMessage');
    this.mergeStrategy = this.parseGitPullRequestMergeStrategy(tl.getInput('mergeStrategy', true)!);
    this.transitionWorkItems = tl.getBoolInput('transitionWorkItems');

    this.accessToken = this.getRequiredEnv("SYSTEM_ACCESSTOKEN");

    const baseUrl = `https://dev.azure.com/${this.organization}/`;
    this.connection = azdev.WebApi.createWithBearerToken(baseUrl, this.accessToken);
  }

  public async execute() {
    const git: ga.IGitApi = await this.connection.getGitApi();

    const gitPullRequestToCreate: gi.GitPullRequest = {
      title: this.title,
      sourceRefName: this.sourceRefName,
      targetRefName: this.targetRefName,
      isDraft: this.isDraft,
      description: this.description
    };

    if (this.shouldCreateMergeBranch) {
      await this.createMergeBranch(git);
      gitPullRequestToCreate.sourceRefName = this.mergeBranchName;
    }

    let pr = await git.createPullRequest(gitPullRequestToCreate, this.repositoryId, this.projectId);

    if (this.reviewers) {
      this.reviewers = this.reviewers.trim();
      if (this.reviewers) {
        const reviewerIdRefs: IdentityRef[] = await this.getReviewerIdentityRefs(this.reviewers.split(','));
        const setReviewers = await git.createPullRequestReviewers(reviewerIdRefs, this.repositoryId, pr.pullRequestId!, this.projectId);
        const invalidReviewers = reviewerIdRefs.filter(o => !setReviewers.find(i => i.id === o.id));
        tl.warning(`Invalid reviewers: "${invalidReviewers.map(x => x.displayName).filter(x => x).join('", "')}"`);
      }
    }

    if (this.setAutoComplete && this.autoCompleteSetBy) {
      const autoCompletedByIdRef = await this.getAutoCompletedByIdentityRef(this.autoCompleteSetBy);
      if (autoCompletedByIdRef) {
        pr = await git.updatePullRequest(
          {
            autoCompleteSetBy: autoCompletedByIdRef,
            completionOptions: {
              bypassPolicy: this.bypassPolicy,
              bypassReason: this.bypassReason,
              deleteSourceBranch: this.deleteSourceBranch,
              mergeCommitMessage: this.mergeCommitMessage,
              mergeStrategy: this.mergeStrategy,
              transitionWorkItems: this.transitionWorkItems
            }
          },
          this.repositoryId,
          pr.pullRequestId!,
          this.projectId);
      }
      
      if (!pr.autoCompleteSetBy) {
        tl.warning(`Unable to set Auto-Completed due to invalid user identity.`)
      }
    }

    console.info(`Pull request created at ${pr.url}`);
  }

  private async createMergeBranch(gitApi: ga.IGitApi) {
    const refs = await gitApi.getRefs(this.repositoryId, this.projectId, this.sourceRefName!.replace('refs/', ''));
    const newObjectId = refs[0].objectId;
    tl.debug(`object ID of ${this.sourceRefName} branch = ${newObjectId}`);
    const refUpdateConfig: gi.GitRefUpdate = {
      name: this.mergeBranchName,
      oldObjectId: '0000000000000000000000000000000000000000',
      newObjectId: newObjectId
    };
    const refUpdateResult = await gitApi.updateRefs([refUpdateConfig], this.repositoryId, this.projectId);
    if (!refUpdateResult[0].success) {
      throw new Error(`Failed to create ${this.mergeBranchName} branch`);
    }
  }

  private getRequiredEnv(name: string): string {
    let val = process.env[name];
    if (!val) {
      throw new ReferenceError(`Environment variable "${name}" is not set`);
    }
    return val;
  }

  private parseGitPullRequestMergeStrategy(mergeStrategy: string): gi.GitPullRequestMergeStrategy {
    switch (mergeStrategy) {
      case 'noFastForward':
        return gi.GitPullRequestMergeStrategy.NoFastForward;
      case 'squash':
        return gi.GitPullRequestMergeStrategy.Squash;
      case 'rebase':
        return gi.GitPullRequestMergeStrategy.Rebase;
      case 'rebaseMerge':
        return gi.GitPullRequestMergeStrategy.RebaseMerge;
      default:
        throw new RangeError(`"${mergeStrategy}" is not a valid merge strategy`);
    }
  }

  private async getReviewerIdentityRefs(reviewers: string[]): Promise<IdentityRef[]> {
    const graph: IGraphApi = await this.getGraphApi();

    const scope = await graph.getDescriptor(this.projectId);
    const groups = await graph.getGroups(scope.value);

    const reviewerIdRefs: IdentityRef[] = [];
    for (let reviewer of reviewers) {
      reviewer = reviewer.trim();
      if (reviewer) {
        const group = groups.find(g => g.displayName === reviewer);
        if (group) {
          reviewerIdRefs.push(<IdentityRef>{ id: group.originId, displayName: reviewer });
          continue;
        }
        const userId = await this.getUserId(reviewer);
        if (userId) {
          reviewerIdRefs.push(userId);
        }
      }
      tl.warning(`"${reviewer}" is not a valid group or user, or has no permission to access this project.`)
    }

    return reviewerIdRefs;
  }

  private getAutoCompletedByIdentityRef(autoCompletedBy: string): Promise<IdentityRef | undefined> {
    return this.getUserId(autoCompletedBy);
  }

  private async findUser(name: string): Promise<GraphUser | undefined> {
    if (!this.cache.users) {
      const graph = await this.getGraphApi();
      this.cache.users = (await graph.getUsers()) || [];
    }
    return this.cache.users.find(g => g.displayName === name);
  }

  private async findEntitlements(username: string): Promise<UserEntitlement[]> {
    const me: IMemberEntitlementApi = await this.getMemberEntitlementApi();
    const entitlements = await me.searchUserEntitlements(username);
    return entitlements.filter(item => item.user.displayName === username);
  }

  private async getUserId(username: string): Promise<IdentityRef | undefined> {
    const user = await this.findUser(username);
    if (user) {
      if (user.origin === 'vsts') {
        return <IdentityRef>{ id: user.originId, displayName: username };
      }

      const entitlements = await this.findEntitlements(username);
      if (entitlements.length > 0) {
        return <IdentityRef>{ id: entitlements[0].id, displayName: username };
      }
    }
    return undefined;
  }

  private async getGraphApi(): Promise<IGraphApi> {
    if (!this.cache.graph) {
      const orgConn = new OrganizationalWebApi(this.connection);
      this.cache.graph = await orgConn.getGraphApi(`https://vssps.dev.azure.com/${this.organization}/`);
    }
    return this.cache.graph;
  }

  private async getMemberEntitlementApi(): Promise<IMemberEntitlementApi> {
    if (!this.cache.memberEntitlement) {
      const orgConn = new OrganizationalWebApi(this.connection);
      this.cache.memberEntitlement = await orgConn.getMemberEntitlementApi(`https://vsaex.dev.azure.com/${this.organization}/`);
    }
    return this.cache.memberEntitlement;
  }
}

const task = new createAzureGitPullRequest();
task.execute().catch(reason => tl.setResult(tl.TaskResult.Failed, reason));