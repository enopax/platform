import { getStoreAsync } from '@/lib/store';
import type { ProjectRole } from '@/lib/store';

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

const PROJECT_ROLE_RANK: Record<ProjectRole, number> = {
  VIEWER: 0,
  DEVELOPER: 1,
  DEPLOYER: 2,
  ADMIN: 3,
};

export async function resolveProjectPermissions(
  userId: string,
  projectId: string,
): Promise<ProjectRole | null> {
  const store = await getStoreAsync();

  const project = await store.projects.findById(projectId);
  if (!project) return null;

  if (project.organisationId) {
    const membership = await store.organisationMembers.findByUserAndOrg(userId, project.organisationId);
    if (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) {
      return 'ADMIN';
    }

    const teamMemberships = await store.teamMembers.findByUserId(userId);
    const projectAccessRows = await store.projectAccess.findByProjectId(projectId);
    const userTeamIds = new Set(teamMemberships.map(tm => tm.teamId));

    let highestRole: ProjectRole | null = null;
    for (const access of projectAccessRows) {
      if (userTeamIds.has(access.teamId)) {
        if (!highestRole || PROJECT_ROLE_RANK[access.role] > PROJECT_ROLE_RANK[highestRole]) {
          highestRole = access.role;
        }
      }
    }
    return highestRole;
  }

  return null;
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
