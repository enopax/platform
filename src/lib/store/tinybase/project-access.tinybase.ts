import type { Store } from 'tinybase';
import type { ProjectAccess, ProjectRole } from '../types';
import type { IProjectAccessRepository, GrantProjectAccessData } from '../repositories/project-access.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'project-access';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToProjectAccess(id: string, row: Record<string, any>): ProjectAccess {
  return {
    id,
    projectId: row.projectId as string,
    teamId: row.teamId as string,
    role: row.role as ProjectRole,
    grantedAt: new Date(row.grantedAt as string),
    grantedBy: row.grantedBy as string,
  };
}

export class TinyBaseProjectAccessRepository implements IProjectAccessRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async grant(data: GrantProjectAccessData): Promise<ProjectAccess> {
    const existing = await this.findByProjectAndTeam(data.projectId, data.teamId);
    if (existing) throw new Error(`Team ${data.teamId} already has access to project ${data.projectId}`);

    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      projectId: data.projectId,
      teamId: data.teamId,
      role: data.role,
      grantedAt: now,
      grantedBy: data.grantedBy,
    });

    return rowToProjectAccess(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<ProjectAccess | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.projectId) return null;
    return rowToProjectAccess(id, row);
  }

  async findByProjectId(projectId: string): Promise<ProjectAccess[]> {
    const results: ProjectAccess[] = [];

    const ids = this.persister
      ? this.persister.lookupIndex(TABLE, 'projectId', projectId)
      : this.store.getRowIds(TABLE);

    for (const id of ids) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.projectId !== projectId) continue;
      if (!row.teamId) continue;
      results.push(rowToProjectAccess(id, row));
    }

    return results;
  }

  async findByTeamId(teamId: string): Promise<ProjectAccess[]> {
    const results: ProjectAccess[] = [];

    const ids = this.persister
      ? this.persister.lookupIndex(TABLE, 'teamId', teamId)
      : this.store.getRowIds(TABLE);

    for (const id of ids) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.teamId !== teamId) continue;
      if (!row.projectId) continue;
      results.push(rowToProjectAccess(id, row));
    }

    return results;
  }

  async findByProjectAndTeam(projectId: string, teamId: string): Promise<ProjectAccess | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex(TABLE, 'projectId', projectId);
      for (const id of ids) {
        const row = this.store.getRow(TABLE, id);
        if (row.teamId === teamId) return rowToProjectAccess(id, row);
      }
      return null;
    }

    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.projectId === projectId && row.teamId === teamId) return rowToProjectAccess(id, row);
    }
    return null;
  }

  async updateRole(id: string, role: ProjectRole): Promise<ProjectAccess> {
    const row = this.store.getRow(TABLE, id);
    if (!row.projectId) throw new Error(`ProjectAccess ${id} not found`);

    this.store.setCell(TABLE, id, 'role', role);

    return rowToProjectAccess(id, this.store.getRow(TABLE, id));
  }

  async revoke(id: string): Promise<void> {
    this.store.delRow(TABLE, id);
  }

  async revokeAllForTeam(teamId: string): Promise<void> {
    const accesses = await this.findByTeamId(teamId);
    for (const access of accesses) {
      this.store.delRow(TABLE, access.id);
    }
  }

  async revokeAllForProject(projectId: string): Promise<void> {
    const accesses = await this.findByProjectId(projectId);
    for (const access of accesses) {
      this.store.delRow(TABLE, access.id);
    }
  }
}
