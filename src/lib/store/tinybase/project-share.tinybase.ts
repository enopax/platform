import type { Store } from 'tinybase';
import type { ProjectShare, SharePermission, ShareStatus, ProjectOwnerType } from '../types';
import type { IProjectShareRepository, CreateProjectShareData } from '../repositories/project-share.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'project-shares';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToProjectShare(id: string, row: Record<string, any>): ProjectShare {
  return {
    id,
    projectId: row.projectId as string,
    sharedWithType: row.sharedWithType as ProjectOwnerType,
    sharedWithId: row.sharedWithId as string,
    permission: row.permission as SharePermission,
    sharedBy: row.sharedBy as string,
    sharedAt: new Date(row.sharedAt as string),
    status: (row.status as ShareStatus) || 'ACTIVE',
  };
}

export class TinyBaseProjectShareRepository implements IProjectShareRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateProjectShareData): Promise<ProjectShare> {
    const existing = await this.findByProjectAndEntity(data.projectId, data.sharedWithType, data.sharedWithId);
    if (existing && existing.status !== 'REVOKED' && existing.status !== 'DECLINED') {
      throw new Error(`Project ${data.projectId} is already shared with ${data.sharedWithType} ${data.sharedWithId}`);
    }

    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      projectId: data.projectId,
      sharedWithType: data.sharedWithType,
      sharedWithId: data.sharedWithId,
      permission: data.permission,
      sharedBy: data.sharedBy,
      sharedAt: now,
      status: 'INVITED',
    });

    return rowToProjectShare(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<ProjectShare | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.projectId) return null;
    return rowToProjectShare(id, row);
  }

  async findByProjectId(projectId: string, status?: ShareStatus): Promise<ProjectShare[]> {
    const results: ProjectShare[] = [];

    const ids = this.persister
      ? this.persister.lookupIndex(TABLE, 'projectId', projectId)
      : this.store.getRowIds(TABLE);

    for (const id of ids) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.projectId !== projectId) continue;
      if (!row.sharedWithId) continue;
      const share = rowToProjectShare(id, row);
      if (status && share.status !== status) continue;
      results.push(share);
    }

    return results;
  }

  async findSharedWithEntity(entityType: ProjectOwnerType, entityId: string, status?: ShareStatus): Promise<ProjectShare[]> {
    const results: ProjectShare[] = [];

    const ids = this.persister
      ? this.persister.lookupIndex(TABLE, 'sharedWithId', entityId)
      : this.store.getRowIds(TABLE);

    for (const id of ids) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.sharedWithId !== entityId) continue;
      if (row.sharedWithType !== entityType) continue;
      if (!row.projectId) continue;
      const share = rowToProjectShare(id, row);
      if (status && share.status !== status) continue;
      results.push(share);
    }

    return results;
  }

  async findByProjectAndEntity(projectId: string, entityType: ProjectOwnerType, entityId: string): Promise<ProjectShare | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex(TABLE, 'projectId', projectId);
      for (const id of ids) {
        const row = this.store.getRow(TABLE, id);
        if (row.sharedWithType === entityType && row.sharedWithId === entityId) return rowToProjectShare(id, row);
      }
      return null;
    }

    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.projectId === projectId && row.sharedWithType === entityType && row.sharedWithId === entityId) {
        return rowToProjectShare(id, row);
      }
    }
    return null;
  }

  async updatePermission(id: string, permission: SharePermission): Promise<ProjectShare> {
    const row = this.store.getRow(TABLE, id);
    if (!row.projectId) throw new Error(`ProjectShare ${id} not found`);

    this.store.setCell(TABLE, id, 'permission', permission);

    return rowToProjectShare(id, this.store.getRow(TABLE, id));
  }

  async updateStatus(id: string, status: ShareStatus): Promise<ProjectShare> {
    const row = this.store.getRow(TABLE, id);
    if (!row.projectId) throw new Error(`ProjectShare ${id} not found`);

    this.store.setCell(TABLE, id, 'status', status);

    return rowToProjectShare(id, this.store.getRow(TABLE, id));
  }

  async revoke(id: string): Promise<void> {
    const row = this.store.getRow(TABLE, id);
    if (!row.projectId) return;
    this.store.setCell(TABLE, id, 'status', 'REVOKED');
  }

  async revokeAllForProject(projectId: string): Promise<void> {
    const shares = await this.findByProjectId(projectId);
    for (const share of shares) {
      this.store.setCell(TABLE, share.id, 'status', 'REVOKED');
    }
  }
}
