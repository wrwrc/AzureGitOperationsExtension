import azdev = require('azure-devops-node-api');
import tl = require('azure-pipelines-task-lib/task');
import { GitAnnotatedTag, GitObjectType } from 'azure-devops-node-api/interfaces/GitInterfaces'; 
import { getConnection } from '../api/common';

class createAzureGitTag {
  private readonly repositoryId: string;
  private readonly projectId: string;
  private readonly connection: azdev.WebApi;
  private message?: string;
  private name: string;
  private commitId: string;

  constructor() {
    this.name = tl.getInput('name', true)!;
    this.message = tl.getInput('message', false);
    this.commitId = tl.getInput('commitId', true)!;
    this.projectId = tl.getInput('projectId', true)!;
    this.repositoryId = tl.getInput('repositoryId', true)!;
    const organization = tl.getInput('organization', true)!;
    this.connection = getConnection(organization);
  }

  async execute() {
    const git = await this.connection.getGitApi();
    const tagObject: GitAnnotatedTag = {
      name: this.name,
      taggedObject: {
        objectId: this.commitId,
        objectType: GitObjectType.Commit
      },
      message: this.message,
    };
    await git.createAnnotatedTag(tagObject, this.projectId, this.repositoryId);
  }
}

const task = new createAzureGitTag();
task.execute().catch(reason => tl.setResult(tl.TaskResult.Failed, reason));