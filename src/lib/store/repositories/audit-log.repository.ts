import type { MembershipAuditLog, MembershipEntity, MembershipAction } from '../types';

export interface CreateAuditLogData {
  entityType: MembershipEntity;
  entityId: string;
  userId: string;
  actorId: string;
  action: MembershipAction;
  oldRole?: string;
  newRole?: string;
  reason?: string;
}

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<MembershipAuditLog>;
  findByEntity(entityType: MembershipEntity, entityId: string, options?: { limit?: number }): Promise<MembershipAuditLog[]>;
  findByUserId(userId: string): Promise<MembershipAuditLog[]>;
}
