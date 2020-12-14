import azdev = require('azure-devops-node-api');
import { IRequestHandler } from 'typed-rest-client/Interfaces';

export function getConnection(org: string): azdev.WebApi {
  let handler: IRequestHandler | undefined;
  const pat: string | undefined = process.env["AZURE_DEVOPS_EXT_PAT"];
  if (pat) {
    handler = azdev.getPersonalAccessTokenHandler(pat!);
  } else {
    const accessToken: string | undefined = process.env["SYSTEM_ACCESSTOKEN"];
    if (accessToken) {
      handler = azdev.getBearerHandler(accessToken!);
    }
  }

  if (!handler) {
    throw new Error('PAT or access token should be provided.');
  }

  const baseUrl = `https://dev.azure.com/${org}/`;
  return new azdev.WebApi(baseUrl, handler);
}