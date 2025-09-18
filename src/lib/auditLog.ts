import { prisma } from '@/lib/prisma';
import { MembershipEntity, MembershipAction } from '@prisma/client';

interface AuditLogParams {
  entityType: MembershipEntity;
  entityId: string;
  userId: string; // Target user
  actorId: string; // Who performed the action
  action: MembershipAction;
  oldRole?: string;
  newRole?: string;
  reason?: string;
}

/**
 * Create an audit log entry for membership changes
 */
export async function createAuditLog({
  entityType,
  entityId,
  userId,
  actorId,
  action,
  oldRole,
  newRole,
  reason
}: AuditLogParams) {
  try {
    await prisma.membershipAuditLog.create({
      data: {
        entityType,
        entityId,
        userId,
        actorId,
        action,
        oldRole,
        newRole,
        reason
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Log organization membership changes
 */
export async function logOrganisationMembershipChange(
  organisationId: string,
  targetUserId: string,
  actorId: string,
  action: MembershipAction,
  oldRole?: string,
  newRole?: string,
  reason?: string
) {
  return createAuditLog({
    entityType: 'ORGANISATION',
    entityId: organisationId,
    userId: targetUserId,
    actorId,
    action,
    oldRole,
    newRole,
    reason
  });
}

/**
 * Log team membership changes
 */
export async function logTeamMembershipChange(
  teamId: string,
  targetUserId: string,
  actorId: string,
  action: MembershipAction,
  oldRole?: string,
  newRole?: string,
  reason?: string
) {
  return createAuditLog({
    entityType: 'TEAM',
    entityId: teamId,
    userId: targetUserId,
    actorId,
    action,
    oldRole,
    newRole,
    reason
  });
}

/**
 * Get audit logs for an entity (organisation or team)
 */
export async function getAuditLogs(
  entityType: MembershipEntity,
  entityId: string,
  limit: number = 50
) {
  try {
    return await prisma.membershipAuditLog.findMany({
      where: {
        entityType,
        entityId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstname: true,
            lastname: true,
            email: true,
            image: true
          }
        },
        actor: {
          select: {
            id: true,
            name: true,
            firstname: true,
            lastname: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

/**
 * Get user display name for audit logs
 */
export function getUserDisplayName(user: {
  name?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
}): string {
  if (user.name) return user.name;
  if (user.firstname && user.lastname) return `${user.firstname} ${user.lastname}`;
  if (user.firstname) return user.firstname;
  return user.email;
}

/**
 * Format audit log action for display
 */
export function formatAuditAction(
  action: MembershipAction,
  oldRole?: string | null,
  newRole?: string | null
): string {
  switch (action) {
    case 'ADDED':
      return newRole ? `Added as ${newRole.toLowerCase()}` : 'Added to membership';
    case 'REMOVED':
      return 'Removed from membership';
    case 'ROLE_CHANGED':
      return `Role changed from ${oldRole?.toLowerCase() || 'unknown'} to ${newRole?.toLowerCase() || 'unknown'}`;
    case 'PROMOTED':
      return `Promoted to ${newRole?.toLowerCase() || 'higher role'}`;
    case 'DEMOTED':
      return `Demoted to ${newRole?.toLowerCase() || 'lower role'}`;
    default:
      return 'Membership updated';
  }
}