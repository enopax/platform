import type { Store } from 'tinybase';
import type { MembershipAuditLog, MembershipEntity, MembershipAction } from '../types';
import type { IAuditLogRepository, CreateAuditLogData } from '../repositories/audit-log.repository';
import crypto from 'crypto';

const TABLE = 'audit-logs';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToAuditLog(id: string, row: Record<string, any>): MembershipAuditLog {
  return {
    id,
    entityType: row.entityType as MembershipEntity,
    entityId: row.entityId as string,
    userId: row.userId as string,
    actorId: row.actorId as string,
    action: row.action as MembershipAction,
    oldRole: (row.oldRole as string) || null,
    newRole: (row.newRole as string) || null,
    reason: (row.reason as string) || null,
    createdAt: new Date(row.createdAt as string),
  };
}

export class TinyBaseAuditLogRepository implements IAuditLogRepository {
  constructor(private store: Store) {}

  async create(data: CreateAuditLogData): Promise<MembershipAuditLog> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      actorId: data.actorId,
      action: data.action,
      oldRole: data.oldRole ?? '',
      newRole: data.newRole ?? '',
      reason: data.reason ?? '',
      createdAt: now,
    });

    return rowToAuditLog(id, this.store.getRow(TABLE, id));
  }

  async findByEntity(
    entityType: MembershipEntity,
    entityId: string,
    options?: { limit?: number }
  ): Promise<MembershipAuditLog[]> {
    const rowIds = this.store.getRowIds(TABLE);
    let results: MembershipAuditLog[] = [];

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (row.entityType === entityType && row.entityId === entityId) {
        results.push(rowToAuditLog(id, row));
      }
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async findByUserId(userId: string): Promise<MembershipAuditLog[]> {
    const rowIds = this.store.getRowIds(TABLE);
    const results: MembershipAuditLog[] = [];

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (row.userId === userId) {
        results.push(rowToAuditLog(id, row));
      }
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results;
  }
}
