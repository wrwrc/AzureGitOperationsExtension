import azdev = require('azure-devops-node-api');
import VsoBaseInterfaces = require('azure-devops-node-api/interfaces/common/VsoBaseInterfaces');
import lim = require("azure-devops-node-api/interfaces/LocationsInterfaces");
import locationsm = require('azure-devops-node-api/LocationsApi');;
import { IGraphApi, GraphApi } from './GraphApi';

export class OrganizationalWebApi {
    private resourceAreas: lim.ResourceAreaInfo[] = [];
    private connection: azdev.WebApi;

    constructor(connection: azdev.WebApi) {
        this.connection = connection;
    }

    public static createWithBearerToken(defaultUrl: string, token: string, options?: VsoBaseInterfaces.IRequestOptions): OrganizationalWebApi {
        return new OrganizationalWebApi(azdev.WebApi.createWithBearerToken(defaultUrl, token, options));
    }

    public async getGraphApi(serverUrl?: string, handlers?: VsoBaseInterfaces.IRequestHandler[]): Promise<IGraphApi> {
        serverUrl = await this._getResourceAreaUrl(serverUrl || this.connection.serverUrl, GraphApi.RESOURCE_AREA_ID);
        handlers = handlers || [this.connection.authHandler];
        return new GraphApi(serverUrl, handlers, this.connection.options);
    }

    private async _getResourceAreaUrl(serverUrl: string, resourceId: string): Promise<string> {
        if (!resourceId) {
            return serverUrl;
        }

        // This must be of type any, see comment just below.
        const resourceAreas: any = await this._getResourceAreas();

        if (resourceAreas === undefined) {
            throw new Error((`Failed to retrieve resource areas ' + 'from server: ${serverUrl}`));
        }

        // The response type differs based on whether or not there are resource areas. When we are on prem we get:
        // {"count":0,"value":null} and when we are on VSTS we get an array of resource areas.
        // Due to this strangeness the type of resourceAreas needs to be any and we need to check .count
        // When going against vsts count will be undefined. On prem it will be 0
        if (!resourceAreas || resourceAreas.length === 0 || resourceAreas.count === 0) {
            // For on prem environments we get an empty list
            return serverUrl;
        }

        for (var resourceArea of resourceAreas) {
            if (resourceArea.id.toLowerCase() === resourceId.toLowerCase()) {
                return resourceArea.locationUrl;
            }
        }

        throw new Error((`Could not find information for resource area ${resourceId} ' + 'from server: ${serverUrl}`));
    }

    private async _getResourceAreas(): Promise<lim.ResourceAreaInfo[]> {
        if (!this.resourceAreas) {
            const locationClient: locationsm.ILocationsApi = await this.connection.getLocationsApi();
            this.resourceAreas = await locationClient.getResourceAreas();
        }

        return this.resourceAreas;
    }
}