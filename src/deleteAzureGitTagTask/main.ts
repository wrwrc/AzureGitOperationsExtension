import azdev = require('azure-devops-node-api');
import tl = require('azure-pipelines-task-lib/task');

class deleteAzureGitTag {
  private readonly repositoryId: string;
  private readonly projectId: string;
  private readonly connection: azdev.WebApi;
  private name: string;

  constructor() {
    this.name = tl.getInput('name', true)!;
    this.projectId = tl.getInput('projectId', true)!;
    this.repositoryId = tl.getInput('repositoryId', true)!;
    const accessToken = this.getRequiredEnv("SYSTEM_ACCESSTOKEN");
    const organization = tl.getInput('organization', true)!;
    const baseUrl = `https://dev.azure.com/${organization}/`;
    this.connection = azdev.WebApi.createWithBearerToken(baseUrl, accessToken);
  }

  async execute() {
    const git = await this.connection.getGitApi();
    const refs = await git.getRefs(this.repositoryId, this.projectId, `tags/${this.name}`);
    const ref = refs.find(r => r.name === `refs/tags/${this.name}`);
    if (!ref) {
      throw new Error(`"${this.name}" doesn't exist.`);
    }
    const result = await git.updateRefs(
      [{
        name: ref.name,
        oldObjectId: ref.objectId,
        newObjectId: "0000000000000000000000000000000000000000"
      }],
      this.repositoryId,
      this.projectId);
    if (!result[0].success) {
      throw new Error('Failed to create annotated tag.');
    }
  }

  private getRequiredEnv(name: string): string {
    let val = process.env[name];
    if (!val) {
      throw new ReferenceError(`Environment variable "${name}" is not set`);
    }
    return val;
  }
}

const task = new deleteAzureGitTag();
task.execute().catch(reason => tl.setResult(tl.TaskResult.Failed, reason));