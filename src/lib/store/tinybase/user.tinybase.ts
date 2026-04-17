import type { Store } from 'tinybase';
import type { User, UserRole, StorageTier } from '../types';
import type { IUserRepository, CreateUserData, UpdateUserData, UserSearchResult } from '../repositories/user.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'users';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToUser(id: string, row: Record<string, any>): User {
  return {
    id,
    firstname: (row.firstname as string) || null,
    lastname: (row.lastname as string) || null,
    name: (row.name as string) || null,
    email: row.email as string,
    emailVerified: row.emailVerified ? new Date(row.emailVerified as string) : null,
    image: (row.image as string) || null,
    password: row.password as string,
    role: row.role as UserRole,
    storageTier: (row.storageTier as StorageTier) || 'FREE_500MB',
    slug: (row.slug as string) || '',
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export class TinyBaseUserRepository implements IUserRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateUserData): Promise<User> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      firstname: data.firstname ?? '',
      lastname: data.lastname ?? '',
      name: data.name ?? '',
      email: data.email,
      emailVerified: '',
      image: data.image ?? '',
      password: data.password ?? '',
      role: data.role ?? 'CUSTOMER',
      storageTier: 'FREE_500MB',
      slug: data.slug || (data.email ? data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-') : ''),
      createdAt: now,
      updatedAt: now,
    });

    return rowToUser(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<User | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.email) return null;
    return rowToUser(id, row);
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex('users', 'email', email);
      if (ids.length > 0) {
        const row = this.store.getRow(TABLE, ids[0]);
        if (row.email) return rowToUser(ids[0], row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.email === email) return rowToUser(id, row);
    }
    return null;
  }

  async findMany(options?: { skip?: number; take?: number; orderBy?: 'createdAt' }): Promise<User[]> {
    const rowIds = this.store.getRowIds(TABLE);
    let results: User[] = [];

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (row.email) results.push(rowToUser(id, row));
    }

    if (options?.orderBy === 'createdAt') {
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    if (options?.skip) results = results.slice(options.skip);
    if (options?.take) results = results.slice(0, options.take);
    return results;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const row = this.store.getRow(TABLE, id);
    if (!row.email) throw new Error(`User ${id} not found`);

    if (data.name !== undefined) this.store.setCell(TABLE, id, 'name', data.name ?? '');
    if (data.firstname !== undefined) this.store.setCell(TABLE, id, 'firstname', data.firstname ?? '');
    if (data.lastname !== undefined) this.store.setCell(TABLE, id, 'lastname', data.lastname ?? '');
    if (data.email !== undefined) this.store.setCell(TABLE, id, 'email', data.email);
    if (data.image !== undefined) this.store.setCell(TABLE, id, 'image', data.image ?? '');
    if (data.role !== undefined) this.store.setCell(TABLE, id, 'role', data.role);
    if (data.password !== undefined) this.store.setCell(TABLE, id, 'password', data.password);
    if (data.emailVerified !== undefined) this.store.setCell(TABLE, id, 'emailVerified', data.emailVerified ? data.emailVerified.toISOString() : '');
    this.store.setCell(TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToUser(id, this.store.getRow(TABLE, id));
  }

  async search(query: string, limit: number = 10): Promise<UserSearchResult[]> {
    const rowIds = this.store.getRowIds(TABLE);
    const q = query.toLowerCase();
    let results: UserSearchResult[] = [];

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (!row.email) continue;

      const matches =
        ((row.name as string) || '').toLowerCase().includes(q) ||
        ((row.firstname as string) || '').toLowerCase().includes(q) ||
        ((row.lastname as string) || '').toLowerCase().includes(q) ||
        ((row.email as string) || '').toLowerCase().includes(q);

      if (matches) {
        results.push({
          id,
          name: (row.name as string) || null,
          firstname: (row.firstname as string) || null,
          lastname: (row.lastname as string) || null,
          email: row.email as string,
          image: (row.image as string) || null,
          role: row.role as UserRole,
          createdAt: new Date(row.createdAt as string),
        });
      }
    }

    results.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    return results.slice(0, limit);
  }

  async count(): Promise<number> {
    return this.store.getRowIds(TABLE).length;
  }
}
