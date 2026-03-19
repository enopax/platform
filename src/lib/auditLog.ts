import { getStoreAsync } from '@/lib/store';
import type { MembershipEntity, MembershipAction, MembershipAuditLog } from '@/lib/store';

interface AuditLogParams {
  entityType: MembershipEntity;
  entityId: string;
  userId: string;
  actorId: string;
  action: MembershipAction;
  oldRole?: string;
  newRole?: string;
  reason?: string;
}

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
    const store = await getStoreAsync();
    await store.auditLogs.create({
      entityType,
      entityId,
      userId,
      actorId,
      action,
      oldRole,
      newRole,
      reason
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

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
    entityType: 'TEAM' as MembershipEntity,
    entityId: teamId,
    userId: targetUserId,
    actorId,
    action,
    oldRole,
    newRole,
    reason
  });
}

export async function getAuditLogs(
  entityType: MembershipEntity,
  entityId: string,
  limit: number = 50
): Promise<MembershipAuditLog[]> {
  try {
    const store = await getStoreAsync();
    return await store.auditLogs.findByEntity(entityType, entityId, { limit });
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

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
