import { prisma } from '@/lib/prisma';

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

/**
 * Check organisation membership and permissions
 * This is a server-side utility to be called in layouts/pages
 */
export async function checkOrganisationPermissions(
  userId: string,
  userRole: string,
  organisationId: string
): Promise<OrganisationPermissions> {
  const isAdmin = userRole === 'ADMIN';

  // Check organisation membership
  const membership = isAdmin
    ? null
    : await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
        select: {
          role: true,
        },
      });

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

/**
 * Check project access permissions
 * All organisation members have access to all projects in their organisation
 */
export async function checkProjectPermissions(
  userId: string,
  userRole: string,
  organisationId: string,
  projectId: string
): Promise<ProjectPermissions> {
  const isAdmin = userRole === 'ADMIN';

  // Check organisation membership (required for project access)
  const orgMembership = isAdmin
    ? { role: 'OWNER' }
    : await prisma.organisationMember.findUnique({
        where: {
          userId_organisationId: {
            userId,
            organisationId,
          },
        },
        select: {
          role: true,
        },
      });

  const isMember = !!orgMembership;

  // All org members can access all projects in the organisation
  // Management permissions are based on organisation role only
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
