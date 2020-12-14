import azdev = require('azure-devops-node-api');
import tl = require('azure-pipelines-task-lib/task');
import { GitAnnotatedTag, GitObjectType } from 'azure-devops-node-api/interfaces/GitInterfaces'; 

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
    const accessToken = this.getRequiredEnv("SYSTEM_ACCESSTOKEN");
    const organization = tl.getInput('organization', true)!;
    const baseUrl = `https://dev.azure.com/${organization}/`;
    this.connection = azdev.WebApi.createWithBearerToken(baseUrl, accessToken);
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

  private getRequiredEnv(name: string): string {
    let val = process.env[name];
    if (!val) {
      throw new ReferenceError(`Environment variable "${name}" is not set`);
    }
    return val;
  }
}

const task = new createAzureGitTag();
task.execute().catch(reason => tl.setResult(tl.TaskResult.Failed, reason));