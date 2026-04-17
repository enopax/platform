export type UserRole = 'GUEST' | 'CUSTOMER' | 'ADMIN';

export type OrganisationRole = 'MEMBER' | 'MANAGER' | 'ADMIN' | 'OWNER';

export type ProjectRole = 'VIEWER' | 'DEVELOPER' | 'DEPLOYER' | 'ADMIN';

export type Visibility = 'PUBLIC' | 'INTERNAL' | 'PRIVATE';

export type NamespaceEntityType = 'USER' | 'ORGANISATION';

export type ProjectOwnerType = 'USER' | 'ORGANISATION';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MembershipEntity = 'ORGANISATION';

export type MembershipAction = 'ADDED' | 'REMOVED' | 'ROLE_CHANGED' | 'PROMOTED' | 'DEMOTED';

export type ResourceType = 'COMPUTE' | 'STORAGE' | 'NETWORK' | 'DATABASE' | 'API' | 'OTHER';

export type ResourceStatus = 'PROVISIONING' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DELETED';

export type StorageTier = 'FREE_500MB' | 'BASIC_5GB' | 'PRO_50GB' | 'ENTERPRISE_500GB' | 'UNLIMITED';

export interface User {
  id: string;
  slug: string;
  firstname: string | null;
  lastname: string | null;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  password: string;
  role: UserRole;
  storageTier: StorageTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  vatNumber: string | null;
  taxId: string | null;
  billingEmail: string | null;
  paymentMethods: unknown | null;
  subscriptionId: string | null;
  subscriptionTier: string | null;
  subscriptionEnds: Date | null;
  isActive: boolean;
  visibility: Visibility;
  defaultProjectVisibility: Visibility;
  maxProjects: number | null;
  maxMembers: number | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganisationMember {
  id: string;
  userId: string;
  organisationId: string;
  role: OrganisationRole;
  joinedAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  organisationId: string;
  name: string;
  description: string | null;
  defaultProjectRole: ProjectRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  addedAt: Date;
  addedBy: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  development: boolean;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: number | null;
  currency: string | null;
  startDate: Date | null;
  endDate: Date | null;
  actualEndDate: Date | null;
  progress: number;
  repositoryUrl: string | null;
  documentationUrl: string | null;
  organisationId: string;
  ownerType: ProjectOwnerType;
  ownerId: string;
  isActive: boolean;
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectAccess {
  id: string;
  projectId: string;
  teamId: string;
  role: ProjectRole;
  grantedAt: Date;
  grantedBy: string;
}

export interface Namespace {
  id: string;
  slug: string;
  entityType: NamespaceEntityType;
  entityId: string;
  createdAt: Date;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface OrganisationInvitation {
  id: string;
  token: string;
  email: string;
  organisationId: string;
  role: OrganisationRole;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  acceptedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganisationJoinRequest {
  id: string;
  userId: string;
  organisationId: string;
  status: JoinRequestStatus;
  respondedBy: string | null;
  requestedAt: Date;
  respondedAt: Date | null;
  updatedAt: Date;
}

export interface MembershipAuditLog {
  id: string;
  entityType: MembershipEntity;
  entityId: string;
  userId: string;
  actorId: string;
  action: MembershipAction;
  oldRole: string | null;
  newRole: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface UserStorageMetrics {
  id: string;
  userId: string;
  date: Date;
  totalFiles: number;
  totalSize: bigint;
  pinnedFiles: number;
  pinnedSize: bigint;
  uploadCount: number;
  downloadCount: number;
  deleteCount: number;
  documentFiles: number;
  imageFiles: number;
  videoFiles: number;
  archiveFiles: number;
  otherFiles: number;
  avgResponseTime: number;
  availabilityRate: number;
}

export interface UserStorageActivity {
  id: string;
  userId: string;
  action: string;
  fileName: string | null;
  fileSize: bigint | null;
  ipfsHash: string | null;
  timestamp: Date;
  responseTime: number | null;
  success: boolean;
  errorMessage: string | null;
}

export interface UserFile {
  id: string;
  userId: string;
  projectId: string | null;
  ipfsHash: string;
  fileName: string;
  fileSize: bigint;
  fileType: string;
  uploadedAt: Date;
  isPinned: boolean;
  replicationCount: number;
  nodeLocations: string[];
  metadata: unknown | null;
  lastSyncAt: Date;
}

export interface UserStorageQuota {
  id: string;
  userId: string;
  tier: StorageTier;
  allocatedBytes: bigint;
  usedBytes: bigint;
  lastUpdated: Date;
  tierUpdatedAt: Date | null;
  tierUpdatedBy: string | null;
  subscriptionId: string | null;
  subscriptionEnds: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  type: ResourceType;
  status: ResourceStatus;
  configuration: unknown | null;
  endpoint: string | null;
  credentials: unknown | null;
  quotaLimit: bigint | null;
  currentUsage: bigint;
  ownerId: string;
  organisationId: string;
  isPublic: boolean;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProjectResource {
  id: string;
  projectId: string;
  resourceId: string;
  allocatedBy: string;
  allocatedAt: Date;
  quotaLimit: bigint | null;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  hashedKey: string;
  permissions: string[];
  userId: string;
  lastUsedAt: Date | null;
  usageCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
