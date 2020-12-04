import * as restm from 'typed-rest-client/RestClient';
import vsom = require('azure-devops-node-api/VsoClient');
import basem = require('azure-devops-node-api/ClientApiBases');
import VsoBaseInterfaces = require('azure-devops-node-api/interfaces/common/VsoBaseInterfaces');
import { UserEntitlement, GroupEntitlement, TypeInfo, PagedGraphMemberList } from './interfaces/MemberEntitlementInterfaces';



export interface IMemberEntitlementApi extends basem.ClientApiBase {
  searchUserEntitlements(name?: string): Promise<UserEntitlement[]>
  getGroupEntitlements(): Promise<GroupEntitlement[]>
}

export class MemberEntitlementApi extends basem.ClientApiBase implements IMemberEntitlementApi {
  constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions) {
    super(baseUrl, handlers, 'node-MemberEntitlement-api', options);
  }

  public static readonly RESOURCE_AREA_ID = "68ddce18-2501-45f1-a17b-7931a9922690";

  public async getGroupEntitlements(): Promise<GroupEntitlement[]> {
    return new Promise<GroupEntitlement[]>(async (resolve, reject) => {
      try {
        let verData: vsom.ClientVersioningData = await this.vsoClient.getVersioningData(
          "6.0-preview.1",
          "MemberEntitlementManagement",
          "2280bffa-58a2-49da-822e-0764a1bb44f7",
          undefined);

        let url: string = verData.requestUrl!;
        let options: restm.IRequestOptions = this.createRequestOptions(
          'application/json',
          verData.apiVersion);

        let res: restm.IRestResponse<GroupEntitlement[]>;
        res = await this.rest.get<GroupEntitlement[]>(url, options);

        let ret = this.formatResponse(res.result, TypeInfo.GroupEntitlement, true);

        resolve(ret);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async searchUserEntitlements(name?: string): Promise<UserEntitlement[]> {
    let queryValues: any = name ? { $filter: `name eq '${name}'` } : {};

    return new Promise<UserEntitlement[]>(async (resolve, reject) => {
      try {
        let continuationToken: any;
        let ret: UserEntitlement[] = [];

        while (true) {

          let verData: vsom.ClientVersioningData = await this.vsoClient.getVersioningData(
            "6.0-preview.3",
            "MemberEntitlementManagement",
            "8480c6eb-ce60-47e9-88df-eca3c801638b",
            undefined,
            queryValues);

          let url: string = verData.requestUrl!;
          let options: restm.IRequestOptions = this.createRequestOptions(
            'application/json',
            verData.apiVersion);

          let res: restm.IRestResponse<PagedGraphMemberList>;
          res = await this.rest.get<PagedGraphMemberList>(url, options);

          const pagedResult = this.formatResponse(res.result, TypeInfo.PagedGraphMemberList, true)

          ret = ret.concat(pagedResult.members);

          continuationToken = pagedResult.continuationToken;
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