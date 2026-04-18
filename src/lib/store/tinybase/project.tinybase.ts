import type { Store } from 'tinybase';
import type { Project, ProjectStatus, ProjectPriority, Visibility, ProjectOwnerType } from '../types';
import type { IProjectRepository, CreateProjectData, UpdateProjectData, ProjectWithFileCount } from '../repositories/project.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'projects';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToProject(id: string, row: Record<string, any>): Project {
  return {
    id,
    name: row.name as string,
    description: (row.description as string) || null,
    development: row.development === 1,
    status: (row.status as ProjectStatus) || 'PLANNING',
    priority: (row.priority as ProjectPriority) || 'MEDIUM',
    budget: row.budget ? Number(row.budget) : null,
    currency: (row.currency as string) || null,
    startDate: row.startDate ? new Date(row.startDate as string) : null,
    endDate: row.endDate ? new Date(row.endDate as string) : null,
    actualEndDate: row.actualEndDate ? new Date(row.actualEndDate as string) : null,
    progress: (row.progress as number) || 0,
    repositoryUrl: (row.repositoryUrl as string) || null,
    documentationUrl: (row.documentationUrl as string) || null,
    organisationId: row.organisationId as string,
    slug: (row.slug as string) || (row.name as string),
    ownerType: ((row.ownerType as string) || 'ORGANISATION') as ProjectOwnerType,
    ownerId: (row.ownerId as string) || (row.organisationId as string),
    visibility: ((row.visibility as string) || 'PRIVATE') as Visibility,
    isActive: row.isActive === 1,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export class TinyBaseProjectRepository implements IProjectRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateProjectData): Promise<Project> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      name: data.name,
      description: data.description ?? '',
      development: (data.development ?? false) ? 1 : 0,
      status: data.status ?? 'PLANNING',
      priority: data.priority ?? 'MEDIUM',
      budget: data.budget?.toString() ?? '',
      currency: data.currency ?? 'GBP',
      startDate: data.startDate ? data.startDate.toISOString() : '',
      endDate: data.endDate ? data.endDate.toISOString() : '',
      actualEndDate: '',
      progress: 0,
      repositoryUrl: data.repositoryUrl ?? '',
      documentationUrl: data.documentationUrl ?? '',
      organisationId: data.organisationId,
      slug: data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      ownerType: 'ORGANISATION',
      ownerId: data.organisationId,
      visibility: 'PRIVATE',
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });

    return rowToProject(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<Project | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.name) return null;
    return rowToProject(id, row);
  }

  async findByIdWithFileCount(id: string): Promise<ProjectWithFileCount | null> {
    const project = await this.findById(id);
    if (!project) return null;
    // Count files in the user-files table for this project
    let fileCount = 0;
    for (const fid of this.store.getRowIds('user-files')) {
      if (this.store.getRow('user-files', fid).projectId === id) fileCount++;
    }
    return { ...project, fileCount };
  }

  async findByNameAndOrg(name: string, organisationId: string): Promise<Project | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex('projects', 'organisationId', organisationId);
      for (const id of ids) {
        const row = this.store.getRow(TABLE, id);
        if (row.name === name && row.isActive === 1) return rowToProject(id, row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.name === name && row.organisationId === organisationId && row.isActive === 1) {
        return rowToProject(id, row);
      }
    }
    return null;
  }

  async findByOrgId(organisationId: string, options?: { isActive?: boolean }): Promise<Project[]> {
    const results: Project[] = [];

    const rowIds = this.persister
      ? this.persister.lookupIndex('projects', 'organisationId', organisationId)
      : this.store.getRowIds(TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.organisationId !== organisationId) continue;
      if (options?.isActive !== undefined) {
        if ((row.isActive === 1) !== options.isActive) continue;
      }
      results.push(rowToProject(id, row));
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results;
  }

  async update(id: string, data: UpdateProjectData): Promise<Project> {
    const row = this.store.getRow(TABLE, id);
    if (!row.name) throw new Error(`Project ${id} not found`);

    if (data.name !== undefined) this.store.setCell(TABLE, id, 'name', data.name);
    if (data.description !== undefined) this.store.setCell(TABLE, id, 'description', data.description ?? '');
    if (data.development !== undefined) this.store.setCell(TABLE, id, 'development', data.development ? 1 : 0);
    if (data.status !== undefined) this.store.setCell(TABLE, id, 'status', data.status);
    if (data.priority !== undefined) this.store.setCell(TABLE, id, 'priority', data.priority);
    if (data.budget !== undefined) this.store.setCell(TABLE, id, 'budget', data.budget?.toString() ?? '');
    if (data.currency !== undefined) this.store.setCell(TABLE, id, 'currency', data.currency ?? '');
    if (data.startDate !== undefined) this.store.setCell(TABLE, id, 'startDate', data.startDate ? data.startDate.toISOString() : '');
    if (data.endDate !== undefined) this.store.setCell(TABLE, id, 'endDate', data.endDate ? data.endDate.toISOString() : '');
    if (data.actualEndDate !== undefined) this.store.setCell(TABLE, id, 'actualEndDate', data.actualEndDate ? data.actualEndDate.toISOString() : '');
    if (data.progress !== undefined) this.store.setCell(TABLE, id, 'progress', data.progress);
    if (data.repositoryUrl !== undefined) this.store.setCell(TABLE, id, 'repositoryUrl', data.repositoryUrl ?? '');
    if (data.documentationUrl !== undefined) this.store.setCell(TABLE, id, 'documentationUrl', data.documentationUrl ?? '');
    if (data.isActive !== undefined) this.store.setCell(TABLE, id, 'isActive', data.isActive ? 1 : 0);
    this.store.setCell(TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToProject(id, this.store.getRow(TABLE, id));
  }

  async transferToOrg(id: string, targetOrgId: string): Promise<Project> {
    const row = this.store.getRow(TABLE, id);
    if (!row.name) throw new Error(`Project ${id} not found`);

    this.store.setCell(TABLE, id, 'organisationId', targetOrgId);
    this.store.setCell(TABLE, id, 'ownerType', 'ORGANISATION');
    this.store.setCell(TABLE, id, 'ownerId', targetOrgId);
    this.store.setCell(TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToProject(id, this.store.getRow(TABLE, id));
  }

  async search(query: string, limit: number = 10): Promise<Project[]> {
    const q = query.toLowerCase();
    let results: Project[] = [];

    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.isActive !== 1) continue;

      const matches =
        ((row.name as string) || '').toLowerCase().includes(q) ||
        ((row.description as string) || '').toLowerCase().includes(q);

      if (matches) results.push(rowToProject(id, row));
    }

    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return results.slice(0, limit);
  }
}
