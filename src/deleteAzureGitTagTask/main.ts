import azdev = require('azure-devops-node-api');
import tl = require('azure-pipelines-task-lib/task');
import { getConnection } from '../api/common';

class deleteAzureGitTag {
  private readonly repositoryId: string;
  private readonly connection: azdev.WebApi;
  private name: string;

  constructor() {
    this.name = tl.getInput('name', true)!;
    this.repositoryId = tl.getInput('repositoryId', true)!;
    const organization = tl.getInput('organization', true)!;
    this.connection = getConnection(organization);
  }

  async execute() {
    const git = await this.connection.getGitApi();
    const refs = await git.getRefs(this.repositoryId, undefined, `tags/${this.name}`);
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
      this.repositoryId);
    if (!result[0].success) {
      console.debug(JSON.stringify(result, undefined, 2));
      throw new Error('Failed to create annotated tag.');
    }
  }
}

const task = new deleteAzureGitTag();
task.execute().catch(reason => tl.setResult(tl.TaskResult.Failed, reason));