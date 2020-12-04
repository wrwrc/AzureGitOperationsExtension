import * as restm from 'typed-rest-client/RestClient';
import vsom = require('azure-devops-node-api/VsoClient');
import basem = require('azure-devops-node-api/ClientApiBases');
import GraphInterfaces = require('azure-devops-node-api/interfaces/GraphInterfaces');
import VsoBaseInterfaces = require('azure-devops-node-api/interfaces/common/VsoBaseInterfaces');

export interface IGraphApi extends basem.ClientApiBase {
  getDescriptor(storageKey: string): Promise<GraphInterfaces.GraphDescriptorResult>;
  getUsers(scopeDescriptor?: string, subjectTypes?: string[]): Promise<GraphInterfaces.GraphUser[]>;
  getGroups(scopeDescriptor?: string, subjectTypes?: string[]): Promise<GraphInterfaces.GraphGroup[]>;
}

export class GraphApi extends basem.ClientApiBase implements IGraphApi {
  constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions) {
    super(baseUrl, handlers, 'node-Graph-api', options);
  }

  public static readonly RESOURCE_AREA_ID = "bb1e7ec9-e901-4b68-999a-de7012b920f8";

  public async getDescriptor(storageKey: string): Promise<GraphInterfaces.GraphDescriptorResult> {
    return new Promise<GraphInterfaces.GraphDescriptorResult>(async (resolve, reject) => {
      const routeValues: any = {
        storageKey: storageKey
      };

      try {
        let verData: vsom.ClientVersioningData = await this.vsoClient.getVersioningData(
          "6.0-preview.1",
          "graph",
          "005e26ec-6b77-4e4f-a986-b3827bf241f5",
          routeValues);

        let url: string = verData.requestUrl!;
        let options: restm.IRequestOptions = this.createRequestOptions(
          'application/json',
          verData.apiVersion);

        let res: restm.IRestResponse<GraphInterfaces.GraphDescriptorResult>;
        res = await this.rest.get<GraphInterfaces.GraphDescriptorResult>(url, options);

        let ret = this.formatResponse(res.result, {}, true);

        resolve(ret);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async getUsers(scopeDescriptor?: string, subjectTypes?: string[]): Promise<GraphInterfaces.GraphUser[]> {
    let queryValues: any = {
      scopeDescriptor: scopeDescriptor,
      subjectTypes: subjectTypes?.join(',')
    };

    return new Promise<GraphInterfaces.GraphUser[]>(async (resolve, reject) => {
      try {
        let continuationToken: any;
        let ret: GraphInterfaces.GraphUser[] = [];

        while (true) {

          let verData: vsom.ClientVersioningData = await this.vsoClient.getVersioningData(
            "6.0-preview.1",
            "graph",
            "005e26ec-6b77-4e4f-a986-b3827bf241f5",
            undefined,
            queryValues);

          let url: string = verData.requestUrl!;

          let options: restm.IRequestOptions = this.createRequestOptions(
            'application/json',
            verData.apiVersion);
          let res: restm.IRestResponse<GraphInterfaces.GraphUser[]>;
          res = await this.rest.get<GraphInterfaces.GraphUser[]>(url, options);

          ret = ret.concat(this.formatResponse(res.result, GraphInterfaces.TypeInfo.GraphUser, true));

          continuationToken = (<any>res.headers)['X-MS-ContinuationToken'];
          if (continuationToken) {
            queryValues.continuationToken = continuationToken;
          } else {
            break;
          }
        }

        resolve(ret);
      } catch (err) {
        reject(err);
      }
    });
  }

  getGroups(scopeDescriptor?: string, subjectTypes?: string[]): Promise<GraphInterfaces.GraphGroup[]> {
    let queryValues: any = {
      scopeDescriptor: scopeDescriptor,
      subjectTypes: subjectTypes?.join(',')
    };

    return new Promise<GraphInterfaces.GraphGroup[]>(async (resolve, reject) => {
      try {
        let continuationToken: any;
        let ret: GraphInterfaces.GraphGroup[] = [];

        while (true) {
          let verData: vsom.ClientVersioningData = await this.vsoClient.getVersioningData(
            "6.0-preview.1",
            "graph",
            "ebbe6af8-0b91-4c13-8cf1-777c14858188",
            undefined,
            queryValues);

          let url: string = verData.requestUrl!;
          let options: restm.IRequestOptions = this.createRequestOptions(
            'application/json',
            verData.apiVersion);

          let res: restm.IRestResponse<GraphInterfaces.GraphGroup[]>;
          res = await this.rest.get<GraphInterfaces.GraphGroup[]>(url, options);

          ret = ret.concat(this.formatResponse(res.result, {}, true));

          continuationToken = (<any>res.headers)['X-MS-ContinuationToken'];
          if (continuationToken) {
            queryValues.continuationToken = continuationToken;
          } else {
            break;
          }
        }

        resolve(ret);
      } catch (err) {
        reject(err);
      }
    });
  }
}