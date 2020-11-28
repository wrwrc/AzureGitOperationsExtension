import azdev = require('azure-devops-node-api');
import ga = require('azure-devops-node-api/GitApi');
import { IdentityRef } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import gi = require('azure-devops-node-api/interfaces/GitInterfaces');
import tl = require('azure-pipelines-task-lib/task');
import { OrganizationalWebApi } from '../api/OrganizationalWebApi';
import { IGraphApi } from '../api/GraphApi';

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

    constructor() {
        this.organization = tl.getInput('organization', true)!;
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

        this.projectId = this.getRequiredEnv('SYSTEM_TEAMPROJECTID');
        this.accessToken = this.getRequiredEnv("SYSTEM_ACCESSTOKEN");

        const baseUrl = this.getRequiredEnv("SYSTEM_TEAMFOUNDATIONCOLLECTIONURI");
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

        const pr = await git.createPullRequest(gitPullRequestToCreate, this.repositoryId, this.projectId);

        if (this.reviewers) {
            this.reviewers = this.reviewers.trim();
            if (this.reviewers) {
                const reviewerIdRefs: IdentityRef[] = await this.getReviewerIdentityRefs(this.reviewers.split(','));
                await git.createPullRequestReviewers(reviewerIdRefs, this.repositoryId, pr.pullRequestId!, this.projectId);
            }
        }

        if (this.setAutoComplete && this.autoCompleteSetBy) {
            const autoCompletedByIdRef = await this.getAutoCompletedByIdentityRef(this.autoCompleteSetBy);
            if (autoCompletedByIdRef) {
                await git.updatePullRequest(
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
        }
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
                throw new RangeError(`'${mergeStrategy}' is not a valid merge strategy`);
        }
    }

    private async getReviewerIdentityRefs(reviewers: string[]): Promise<IdentityRef[]> {
        const graph: IGraphApi = await this.getGraphApi();

        const scope = await graph.getDescriptor(this.projectId);
        const groups = await graph.getGroups(scope.value);

        const users = await graph.getUsers();

        const reviewerIdRefs: IdentityRef[] = [];
        for (let reviewer of reviewers) {
            reviewer = reviewer.trim();
            if (reviewer) {
                const group = groups.find(g => g.displayName === reviewer);
                if (group) {
                    reviewerIdRefs.push(<IdentityRef>{ id: group.originId });
                    continue;
                }
                const user = users.find(u => u.displayName === reviewer);
                if (user) {
                    reviewerIdRefs.push(<IdentityRef>{ id: user.originId });
                    continue;
                }
            }
        }

        return reviewerIdRefs;
    }

    private async getAutoCompletedByIdentityRef(autoCompletedBy: string): Promise<IdentityRef|undefined> {
        const graph: IGraphApi = await this.getGraphApi();

        const users = await graph.getUsers();
        const user = users.find(u => u.displayName === autoCompletedBy);

        return user ? <IdentityRef>{ id: user.originId } : undefined;
    }

    private getGraphApi(): Promise<IGraphApi> {
        const orgConn = OrganizationalWebApi.createWithBearerToken(
            `https://vssps.dev.azure.com/${this.organization}/`,
            this.accessToken);
        return orgConn.getGraphApi();
    }
}

const task = new createAzureGitPullRequest();
task.execute().catch(reason => tl.setResult(tl.TaskResult.Failed, reason));