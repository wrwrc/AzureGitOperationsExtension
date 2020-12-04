import GraphInterfaces = require('azure-devops-node-api/interfaces/GraphInterfaces');

export interface PagedGraphMemberList {
  members: UserEntitlement[],
  continuationToken: string | null,
}

export interface UserEntitlement {
  accessLevel: AccessLevel
  dateCreated: string
  groupAssignments: GroupEntitlement[]
  id: string
  lastAccessedDate: string
  projectEntitlements: ProjectEntitlement[]
  user: GraphInterfaces.GraphUser
}

export interface GroupEntitlement {
  group: GraphInterfaces.GraphGroup
  id: string
  lastExecuted: string
  licenseRule: AccessLevel
  members: UserEntitlement[]
  projectEntitlements: ProjectEntitlement[]
  status: string
}

export interface ProjectEntitlement {
  assignmentSource: string
  group: Group
  projectPermissionInherited: string
  projectRef: ProjectRef
  teamRefs: TeamRef[]
}

export interface Group {
  displayName: string
  groupType: string
}

export interface Ref {
  id: string
  name: string
}

export interface ProjectRef extends Ref { }

export interface TeamRef extends Ref { }

export interface AccessLevel {
  accountLicenseType: string
  assignmentSource: string
  licenseDisplayName: string
  licensingSource: string
  msdnLicenseType: string
  status: string
  statusMessage: string
}

export var TypeInfo = {
  PagedGraphMemberList: <any>{},
  UserEntitlement: <any>{},
  GroupEntitlement: <any>{},
  ProjectEntitlement: <any>{},
  TeamRef: <any>{}
};

TypeInfo.UserEntitlement.fields = {
  dateCreated: {
    isDate: true
  },
  lastAccessedDate: {
    isDate: true
  },
  groupAssignments: {
    isArray: true,
    typeInfo: TypeInfo.GroupEntitlement
  },
  projectEntitlements: {
    isArray: true,
    typeInfo: TypeInfo.ProjectEntitlement
  },
  user: {
    typeInfo: GraphInterfaces.TypeInfo.GraphUser
  }
}

TypeInfo.GroupEntitlement.fields = {
  lastExecuted: {
    isDate: true
  },
  members: {
    isArray: true,
    typeInfo: TypeInfo.UserEntitlement
  },
  projectEntitlements: {
    isArray: true,
    typeInfo: TypeInfo.ProjectEntitlement
  }
};

TypeInfo.ProjectEntitlement.fields = {
  teamRefs: {
    isArray: true,
    typeInfo: TypeInfo.TeamRef
  }
};