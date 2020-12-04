"use strict";
exports.__esModule = true;
exports.TypeInfo = void 0;
var GraphInterfaces = require("azure-devops-node-api/interfaces/GraphInterfaces");
exports.TypeInfo = {
    PagedGraphMemberList: {},
    UserEntitlement: {},
    GroupEntitlement: {},
    ProjectEntitlement: {},
    TeamRef: {}
};
exports.TypeInfo.UserEntitlement.fields = {
    dateCreated: {
        isDate: true
    },
    lastAccessedDate: {
        isDate: true
    },
    groupAssignments: {
        isArray: true,
        typeInfo: exports.TypeInfo.GroupEntitlement
    },
    projectEntitlements: {
        isArray: true,
        typeInfo: exports.TypeInfo.ProjectEntitlement
    },
    user: {
        typeInfo: GraphInterfaces.TypeInfo.GraphUser
    }
};
exports.TypeInfo.GroupEntitlement.fields = {
    lastExecuted: {
        isDate: true
    },
    members: {
        isArray: true,
        typeInfo: exports.TypeInfo.UserEntitlement
    },
    projectEntitlements: {
        isArray: true,
        typeInfo: exports.TypeInfo.ProjectEntitlement
    }
};
exports.TypeInfo.ProjectEntitlement.fields = {
    teamRefs: {
        isArray: true,
        typeInfo: exports.TypeInfo.TeamRef
    }
};
