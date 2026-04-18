import type { Store } from 'tinybase';
import type { ProjectRoleDefinition, ProjectPermission } from '../types';
import type { IProjectRoleRepository, CreateProjectRoleData, UpdateProjectRoleData } from '../repositories/project-role.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'project-roles';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToRole(id: string, row: Record<string, any>): ProjectRoleDefinition {
  return {
    id,
    organisationId: row.organisationId as string,
    name: row.name as string,
    description: (row.description as string) || '',
    permissions: JSON.parse((row.permissions as string) || '[]') as ProjectPermission[],
    isBuiltIn: row.isBuiltIn === 1,
    rank: row.rank as number,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export class TinyBaseProjectRoleRepository implements IProjectRoleRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateProjectRoleData): Promise<ProjectRoleDefinition> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      organisationId: data.organisationId,
      name: data.name,
      description: data.description ?? '',
      permissions: JSON.stringify(data.permissions),
      isBuiltIn: data.isBuiltIn ? 1 : 0,
      rank: data.rank,
      createdAt: now,
      updatedAt: now,
    });

    return rowToRole(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<ProjectRoleDefinition | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.name) return null;
    return rowToRole(id, row);
  }

  async findByOrgId(organisationId: string): Promise<ProjectRoleDefinition[]> {
    const results: ProjectRoleDefinition[] = [];

    const ids = this.persister
      ? this.persister.lookupIndex(TABLE, 'organisationId', organisationId)
      : this.store.getRowIds(TABLE);

    for (const id of ids) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.organisationId !== organisationId) continue;
      if (!row.name) continue;
      results.push(rowToRole(id, row));
    }

    return results;
  }

  async findByNameAndOrg(name: string, organisationId: string): Promise<ProjectRoleDefinition | null> {
    const roles = await this.findByOrgId(organisationId);
    return roles.find(r => r.name === name) ?? null;
  }

  async findBuiltInByOrg(organisationId: string): Promise<ProjectRoleDefinition[]> {
    const roles = await this.findByOrgId(organisationId);
    return roles.filter(r => r.isBuiltIn);
  }

  async update(id: string, data: UpdateProjectRoleData): Promise<ProjectRoleDefinition> {
    const row = this.store.getRow(TABLE, id);
    if (!row.name) throw new Error(`ProjectRoleDefinition ${id} not found`);

    if (data.name !== undefined) this.store.setCell(TABLE, id, 'name', data.name);
    if (data.description !== undefined) this.store.setCell(TABLE, id, 'description', data.description);
    if (data.permissions !== undefined) this.store.setCell(TABLE, id, 'permissions', JSON.stringify(data.permissions));
    if (data.rank !== undefined) this.store.setCell(TABLE, id, 'rank', data.rank);
    this.store.setCell(TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToRole(id, this.store.getRow(TABLE, id));
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);
    if (!role) return;
    if (role.isBuiltIn) throw new Error('Cannot delete built-in role');
    this.store.delRow(TABLE, id);
  }
}
