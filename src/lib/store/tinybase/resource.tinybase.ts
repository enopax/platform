import type { Store } from 'tinybase';
import type { Resource, ResourceType, ResourceStatus, ProjectResource } from '../types';
import type { IResourceRepository, CreateResourceData, UpdateResourceData, IProjectResourceRepository } from '../repositories/resource.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const RES_TABLE = 'resources';
const PR_TABLE = 'project-resources';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToResource(id: string, row: Record<string, any>): Resource {
  return {
    id,
    name: row.name as string,
    description: (row.description as string) || null,
    type: (row.type as ResourceType) || 'OTHER',
    status: (row.status as ResourceStatus) || 'ACTIVE',
    configuration: row.configuration ? JSON.parse(row.configuration as string) : null,
    endpoint: (row.endpoint as string) || null,
    credentials: row.credentials ? JSON.parse(row.credentials as string) : null,
    quotaLimit: row.quotaLimit ? BigInt(row.quotaLimit as string) : null,
    currentUsage: BigInt(row.currentUsage as string || '0'),
    ownerId: row.ownerId as string,
    organisationId: row.organisationId as string,
    isPublic: row.isPublic === 1,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    isActive: row.isActive === 1,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
    deletedAt: row.deletedAt ? new Date(row.deletedAt as string) : null,
  };
}

function rowToProjectResource(id: string, row: Record<string, any>): ProjectResource {
  return {
    id,
    projectId: row.projectId as string,
    resourceId: row.resourceId as string,
    allocatedBy: row.allocatedBy as string,
    allocatedAt: new Date(row.allocatedAt as string),
    quotaLimit: row.quotaLimit ? BigInt(row.quotaLimit as string) : null,
  };
}

export class TinyBaseResourceRepository implements IResourceRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateResourceData): Promise<Resource> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(RES_TABLE, id, {
      name: data.name,
      description: data.description ?? '',
      type: data.type ?? 'OTHER',
      status: data.status ?? 'ACTIVE',
      configuration: data.configuration ? JSON.stringify(data.configuration) : '',
      endpoint: data.endpoint ?? '',
      credentials: data.credentials ? JSON.stringify(data.credentials) : '',
      quotaLimit: '',
      currentUsage: '0',
      ownerId: data.ownerId,
      organisationId: data.organisationId,
      isPublic: 0,
      tags: JSON.stringify(data.tags ?? []),
      isActive: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: '',
    });

    return rowToResource(id, this.store.getRow(RES_TABLE, id));
  }

  async findById(id: string): Promise<Resource | null> {
    const row = this.store.getRow(RES_TABLE, id);
    if (!row.name) return null;
    return rowToResource(id, row);
  }

  async findByOrgId(organisationId: string): Promise<Resource[]> {
    const results: Resource[] = [];
    const rowIds = this.persister
      ? this.persister.lookupIndex('resources', 'organisationId', organisationId)
      : this.store.getRowIds(RES_TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(RES_TABLE, id);
      if (!this.persister && row.organisationId !== organisationId) continue;
      if (row.isActive === 1) {
        results.push(rowToResource(id, row));
      }
    }
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results;
  }

  async findByOwnerId(ownerId: string): Promise<Resource[]> {
    const results: Resource[] = [];
    for (const id of this.store.getRowIds(RES_TABLE)) {
      const row = this.store.getRow(RES_TABLE, id);
      if (row.ownerId === ownerId && row.isActive === 1) {
        results.push(rowToResource(id, row));
      }
    }
    return results;
  }

  async findByStatus(status: ResourceStatus): Promise<Resource[]> {
    const results: Resource[] = [];
    for (const id of this.store.getRowIds(RES_TABLE)) {
      const row = this.store.getRow(RES_TABLE, id);
      if (row.status === status) results.push(rowToResource(id, row));
    }
    return results;
  }

  async findByNameAndOrg(name: string, organisationId: string, excludeId?: string): Promise<Resource | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex('resources', 'organisationId', organisationId);
      for (const id of ids) {
        if (id === excludeId) continue;
        const row = this.store.getRow(RES_TABLE, id);
        if (row.name === name && row.isActive === 1) return rowToResource(id, row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(RES_TABLE)) {
      const row = this.store.getRow(RES_TABLE, id);
      if (row.name === name && row.organisationId === organisationId && row.isActive === 1 && id !== excludeId) {
        return rowToResource(id, row);
      }
    }
    return null;
  }

  async update(id: string, data: UpdateResourceData): Promise<Resource> {
    const row = this.store.getRow(RES_TABLE, id);
    if (!row.name) throw new Error(`Resource ${id} not found`);

    if (data.name !== undefined) this.store.setCell(RES_TABLE, id, 'name', data.name);
    if (data.description !== undefined) this.store.setCell(RES_TABLE, id, 'description', data.description ?? '');
    if (data.type !== undefined) this.store.setCell(RES_TABLE, id, 'type', data.type);
    if (data.status !== undefined) this.store.setCell(RES_TABLE, id, 'status', data.status);
    if (data.configuration !== undefined) this.store.setCell(RES_TABLE, id, 'configuration', data.configuration ? JSON.stringify(data.configuration) : '');
    if (data.endpoint !== undefined) this.store.setCell(RES_TABLE, id, 'endpoint', data.endpoint ?? '');
    if (data.credentials !== undefined) this.store.setCell(RES_TABLE, id, 'credentials', data.credentials ? JSON.stringify(data.credentials) : '');
    if (data.quotaLimit !== undefined) this.store.setCell(RES_TABLE, id, 'quotaLimit', data.quotaLimit ? data.quotaLimit.toString() : '');
    if (data.currentUsage !== undefined) this.store.setCell(RES_TABLE, id, 'currentUsage', data.currentUsage.toString());
    if (data.isPublic !== undefined) this.store.setCell(RES_TABLE, id, 'isPublic', data.isPublic ? 1 : 0);
    if (data.tags !== undefined) this.store.setCell(RES_TABLE, id, 'tags', JSON.stringify(data.tags));
    if (data.isActive !== undefined) this.store.setCell(RES_TABLE, id, 'isActive', data.isActive ? 1 : 0);
    if (data.deletedAt !== undefined) this.store.setCell(RES_TABLE, id, 'deletedAt', data.deletedAt ? data.deletedAt.toISOString() : '');
    this.store.setCell(RES_TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToResource(id, this.store.getRow(RES_TABLE, id));
  }

  async delete(id: string): Promise<void> {
    this.store.delRow(RES_TABLE, id);
  }

  async search(query: string, limit: number = 10): Promise<Resource[]> {
    const q = query.toLowerCase();
    let results: Resource[] = [];

    for (const id of this.store.getRowIds(RES_TABLE)) {
      const row = this.store.getRow(RES_TABLE, id);
      if (row.isActive !== 1) continue;

      const matches =
        ((row.name as string) || '').toLowerCase().includes(q) ||
        ((row.description as string) || '').toLowerCase().includes(q);

      if (matches) results.push(rowToResource(id, row));
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results.slice(0, limit);
  }
}

export class TinyBaseProjectResourceRepository implements IProjectResourceRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: { projectId: string; resourceId: string; allocatedBy: string; quotaLimit?: bigint }): Promise<ProjectResource> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(PR_TABLE, id, {
      projectId: data.projectId,
      resourceId: data.resourceId,
      allocatedBy: data.allocatedBy,
      allocatedAt: now,
      quotaLimit: data.quotaLimit ? data.quotaLimit.toString() : '',
    });

    return rowToProjectResource(id, this.store.getRow(PR_TABLE, id));
  }

  async findByProjectId(projectId: string): Promise<ProjectResource[]> {
    const results: ProjectResource[] = [];
    const rowIds = this.persister
      ? this.persister.lookupIndex('project-resources', 'projectId', projectId)
      : this.store.getRowIds(PR_TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(PR_TABLE, id);
      if (!this.persister && row.projectId !== projectId) continue;
      results.push(rowToProjectResource(id, row));
    }
    return results;
  }

  async findByResourceId(resourceId: string): Promise<ProjectResource[]> {
    const results: ProjectResource[] = [];
    const rowIds = this.persister
      ? this.persister.lookupIndex('project-resources', 'resourceId', resourceId)
      : this.store.getRowIds(PR_TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(PR_TABLE, id);
      if (!this.persister && row.resourceId !== resourceId) continue;
      results.push(rowToProjectResource(id, row));
    }
    return results;
  }

  async findByProjectAndResource(projectId: string, resourceId: string): Promise<ProjectResource | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex('project-resources', 'projectId', projectId);
      for (const id of ids) {
        const row = this.store.getRow(PR_TABLE, id);
        if (row.resourceId === resourceId) return rowToProjectResource(id, row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(PR_TABLE)) {
      const row = this.store.getRow(PR_TABLE, id);
      if (row.projectId === projectId && row.resourceId === resourceId) {
        return rowToProjectResource(id, row);
      }
    }
    return null;
  }

  async update(projectId: string, resourceId: string, data: { quotaLimit?: bigint }): Promise<ProjectResource> {
    for (const id of this.store.getRowIds(PR_TABLE)) {
      const row = this.store.getRow(PR_TABLE, id);
      if (row.projectId === projectId && row.resourceId === resourceId) {
        if (data.quotaLimit !== undefined) this.store.setCell(PR_TABLE, id, 'quotaLimit', data.quotaLimit ? data.quotaLimit.toString() : '');
        return rowToProjectResource(id, this.store.getRow(PR_TABLE, id));
      }
    }
    throw new Error(`ProjectResource not found for project ${projectId} and resource ${resourceId}`);
  }

  async delete(projectId: string, resourceId: string): Promise<void> {
    for (const id of this.store.getRowIds(PR_TABLE)) {
      const row = this.store.getRow(PR_TABLE, id);
      if (row.projectId === projectId && row.resourceId === resourceId) {
        this.store.delRow(PR_TABLE, id);
        return;
      }
    }
  }
}
