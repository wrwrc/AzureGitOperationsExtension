# Azure Git Operations

Tasks:
1. [Create Azure Git Pull Request](#CreateAzureGitPullRequest)
2. [Create Azure Git Tag](#CreateAzureGitTag)
3. [Delete Azure Git Tag](#DeleteAzureGitTag)

## Create Azure Git Pull Request

### YAML snippet

```yaml
- task: CreateAzureGitPRTask@0
  inputs:
    organization:
    projectId:
    repositoryId:
    sourceRefName:
    targetRefName:
    #title: # Optional
    #description: #Optional
    #isDraft: false # Optional
    #reviewers: #Optional
    #createMergeBranch: false # Optional
    #mergeBranchName: # Required when createMergeBranch == true
    #setAutoComplete: false # Optional
    #autoCompleteSetBy: # Required when setAutoComplete == true
    #byPassPolicy: false # Optional
    #mergeStrategy: 'noFastForward' # Options: squash, rebase, rebaseMerge
    #deleteSourceBranch: false # Optional
    #customizeMergeCommitMessage: false # Optional
    #mergeCommitMessage: # Required when customizeMergeCommitMessage == true
    #transitionWorkItems: false # Optional
```

### Arguments

| argument | description |
|:---------|:------------|
| `organization` | Specifies the organization name. It will be used to construct the base URL of the Azure DevOps API. |
| `projectId` | Specifies the ID of the Azure DevOps project. You can get it from the predefined variable `$(System.TeamProjectId)`. |
| `repositoryId` | Specifies the ID of the Azure Git Repo. You can get it from the predefined variable `$(Build.Repository.ID)`. |
| `sourceRefName` | Specifies the source branch of the pull request. For example: `refs/heads/develop`. |
| `targetRefName` | Specifies the target branch of the pull request. For example: `refs/heads/master`. |
| `title` | The title of the pull request. |
| `description` | The description of the pull request. |
| `isDraft` | Create as a draft pull request. |
| `reviewers` | Specifies the reviewers of the pull request. Accepts group name and username, names are seperated with comma(`,`). For example: `Contributors,Lila Durham,Raymond Burke`. |
| `createMergeBranch` | If `true`, it will create a new branch from the source branch specified, and then create the pull request from this new branch. |
| `mergeBranchName` | The name of the branch being created. The name should be formatted as `refs/heads/yourbranchname`. |
| `setAutoComplete` | Set auto-complete. |
| `autoCompleteSetBy` | Specifies who sets auto-complete. |
| `byPassPolicy` | If `true`, the pull request is exempt from policy enforcement. Only takes effects when `setAutoComplete` is `true`. |
| `byPassReason` | Specifies the bypass reason when `bypassPolicy` is `true`. |
| `mergeStrategy` | Specifies the merge strategy of auto-complete.\nOptions: `noFastForward`, `squash`, `rebase`, `rebaseMerge`. |
| `deleteSourceBranch` | If `true`, the source branch will be deleted when the pull request is completed. Only takes effect when `setAutoComplete` is `true`. |
| `customizeMergeCommitMessage` | Use custom merge commit message. Only takes effect when `setAutoComplete` is `true`. |
| `mergeCommitMessage` | The custom merge commit message. |
| `transitionWorkItems` | If `true`, the state of the work items linked to the pull request will be updated when the pull request is completed. Only takes effect when `setAutoComplete` is `true`. |

## Create Azure Git Tag

### YAML snippet

```yaml
- task: CreateAzureGitTagTask@0
  inputs:
    organization:
    projectId:
    repositoryId:
    name:
    commitId:
    #message: # Optional
```

### Arguments

| argument | description |
|:---------|:------------|
| `organization` | Specifies the organization name. It will be used to construct the base URL of the Azure DevOps API. |
| `projectId` | Specifies the ID of the Azure DevOps project. You can get it from the predefined variable `$(System.TeamProjectId)`. |
| `repositoryId` | Specifies the ID of the Azure Git Repo. You can get it from the predefined variable `$(Build.Repository.ID)`. |
| `name` | Specifies the tag name. |
| `commitId` | Specifies the ID of the commit to be tagged. |
| `message` | Specifies the tag message. |

## Delete Azure Git Tag

### YAML snippet

```yaml
- task: DeleteAzureGitTagTask@0
  inputs:
    organization:
    projectId:
    repositoryId:
    name:
```

### Arguments

| argument | description |
|:---------|:------------|
| `organization` | Specifies the organization name. It will be used to construct the base URL of the Azure DevOps API. |
| `projectId` | Specifies the ID of the Azure DevOps project. You can get it from the predefined variable `$(System.TeamProjectId)`. |
| `repositoryId` | Specifies the ID of the Azure Git Repo. You can get it from the predefined variable `$(Build.Repository.ID)`. |
| `name` | Specifies the tag name. |