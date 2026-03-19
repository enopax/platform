import { getStoreAsync } from '@/lib/store';

export type OrganisationPermissions = {
  isMember: boolean;
  isOwner: boolean;
  isManager: boolean;
  isAdmin: boolean;
  canManage: boolean;
};

export type ProjectPermissions = {
  isMember: boolean;
  canManage: boolean;
};

export async function checkOrganisationPermissions(
  userId: string,
  userRole: string,
  organisationId: string
): Promise<OrganisationPermissions> {
  const isAdmin = userRole === 'ADMIN';

  const store = await getStoreAsync();
  const membership = isAdmin
    ? null
    : await store.organisationMembers.findByUserAndOrg(userId, organisationId);

  const isMember = !!membership;
  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';
  const canManage = isAdmin || isOwner || isManager;

  return {
    isMember,
    isOwner,
    isManager,
    isAdmin,
    canManage,
  };
}

export async function checkProjectPermissions(
  userId: string,
  userRole: string,
  organisationId: string,
  projectId: string
): Promise<ProjectPermissions> {
  const isAdmin = userRole === 'ADMIN';

  const store = await getStoreAsync();
  const orgMembership = isAdmin
    ? { role: 'OWNER' as const }
    : await store.organisationMembers.findByUserAndOrg(userId, organisationId);

  const isMember = !!orgMembership;
  const canManage =
    isAdmin ||
    orgMembership?.role === 'OWNER' ||
    orgMembership?.role === 'MANAGER' ||
    orgMembership?.role === 'ADMIN';

  return {
    isMember,
    canManage,
  };
}
