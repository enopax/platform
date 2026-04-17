import type { Store } from 'tinybase';
import type { Namespace, NamespaceEntityType } from '../types';
import type { INamespaceRepository, RegisterNamespaceData } from '../repositories/namespace.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'namespaces';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToNamespace(id: string, row: Record<string, any>): Namespace {
  return {
    id,
    slug: row.slug as string,
    entityType: row.entityType as NamespaceEntityType,
    entityId: row.entityId as string,
    createdAt: new Date(row.createdAt as string),
  };
}

export class TinyBaseNamespaceRepository implements INamespaceRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async register(data: RegisterNamespaceData): Promise<Namespace> {
    const slug = data.slug.toLowerCase();

    const RESERVED_SLUGS = new Set([
      'account', 'admin', 'signin', 'register', 'accept-invite', 'api',
      '_next', 'assets', 'icons', 'settings', 'new', 'explore', 'orga',
      'auth', 'teams', 'members', 'projects', 'resources', 'delete', 'edit',
    ]);
    if (RESERVED_SLUGS.has(slug)) throw new Error(`Slug "${slug}" is reserved`);

    const existing = await this.findBySlug(slug);
    if (existing) throw new Error(`Slug "${slug}" is already taken`);

    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      slug,
      entityType: data.entityType,
      entityId: data.entityId,
      createdAt: now,
    });

    return rowToNamespace(id, this.store.getRow(TABLE, id));
  }

  async findBySlug(slug: string): Promise<Namespace | null> {
    const normalised = slug.toLowerCase();

    if (this.persister) {
      const ids = this.persister.lookupIndex(TABLE, 'slug', normalised);
      for (const id of ids) {
        const row = this.store.getRow(TABLE, id);
        if (row.slug) return rowToNamespace(id, row);
      }
      return null;
    }

    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.slug === normalised) return rowToNamespace(id, row);
    }
    return null;
  }

  async findByEntity(entityType: NamespaceEntityType, entityId: string): Promise<Namespace | null> {
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.entityType === entityType && row.entityId === entityId) {
        return rowToNamespace(id, row);
      }
    }
    return null;
  }

  async isAvailable(slug: string): Promise<boolean> {
    return (await this.findBySlug(slug)) === null;
  }

  async delete(slug: string): Promise<void> {
    const ns = await this.findBySlug(slug);
    if (ns) this.store.delRow(TABLE, ns.id);
  }
}
