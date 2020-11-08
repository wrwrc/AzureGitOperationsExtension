import api = require('azure-devops-node-api');
import ga = require('azure-devops-node-api/GitApi');
import gi = require('azure-devops-node-api/interfaces/GitInterfaces');
import tl = require('azure-pipelines-task-lib/task');

class createAzureGitPullRequest {
    private repositoryId: string;
    private projectId: string;
    private webApi: api.WebApi;
    private shouldCreateMergeBranch: boolean;
    private mergeBranchName: string | undefined;
    private title: string | undefined;
    private sourceRefName: string | undefined;
    private targetRefName: string | undefined;
    private isDraft: boolean;
    private description: string | undefined;
    private setAutoComplete: boolean;
    private autoCompleteSetBy: string | undefined;
    private transitionWorkItems: boolean;
    private mergeCommitMessage: string | undefined;
    private deleteSourceBranch: boolean;
    private bypassReason: string | undefined;
    private bypassPolicy: boolean;
    private mergeStrategy: gi.GitPullRequestMergeStrategy;

    constructor() {
        this.repositoryId = tl.getInput('repositoryId', true)!;
        this.sourceRefName = tl.getInput('sourceRefName', true);
        this.targetRefName = tl.getInput('targetRefName', true);
        this.title = tl.getInput('title');
        this.description = tl.getInput('description');
        this.isDraft = tl.getBoolInput('isDraft');
        this.shouldCreateMergeBranch = tl.getBoolInput('createMergeBranch');
        this.mergeBranchName = tl.getInput('mergeBranchName', this.shouldCreateMergeBranch);
        this.setAutoComplete = tl.getBoolInput('setAutoComplete');
        this.autoCompleteSetBy = tl.getInput('autoCompleteSetBy', this.setAutoComplete);
        this.bypassPolicy = tl.getBoolInput('byPassPolicy');
        this.bypassReason = tl.getInput('byPassReason');
        this.deleteSourceBranch = tl.getBoolInput('deleteSourceBranch');
        this.mergeCommitMessage = tl.getInput('mergeCommitMessage');
        this.mergeStrategy = this.parseGitPullRequestMergeStrategy(tl.getInput('mergeStrategy', true)!);
        this.transitionWorkItems = tl.getBoolInput('transitionWorkItems');

        this.projectId = this.getRequiredEnv('SYSTEM_TEAMPROJECTID');

        const accessToken = this.getRequiredEnv("SYSTEM_ACCESSTOKEN");
        const baseUrl = this.getRequiredEnv("SYSTEM_TEAMFOUNDATIONCOLLECTIONURI");
        this.webApi = api.WebApi.createWithBearerToken(baseUrl, accessToken);
    }

    public async execute() {
        const gitApi = await this.webApi.getGitApi();

        const gitPullRequestToCreate: gi.GitPullRequest = {
            title: this.title,
            sourceRefName: this.sourceRefName,
            targetRefName: this.targetRefName,
            isDraft: this.isDraft,
            description: this.description
        };

        if (this.shouldCreateMergeBranch) {
            await this.createMergeBranch(gitApi);
            gitPullRequestToCreate.sourceRefName = this.mergeBranchName;
        }

        const pr = await gitApi.createPullRequest(gitPullRequestToCreate, this.repositoryId, this.projectId);

        if (this.setAutoComplete) {
            await gitApi.updatePullRequest(
                {
                    autoCompleteSetBy: {
                        id: this.autoCompleteSetBy
                    },
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
}

const task = new createAzureGitPullRequest();
task.execute().catch(reason => tl.setResult(tl.TaskResult.Failed, reason));