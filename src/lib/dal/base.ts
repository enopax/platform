import { nanoid } from 'nanoid';
import { getDB } from '@/lib/tinybase/db';
import type { Store, Id, Row } from 'tinybase';

/**
 * Base model class providing common CRUD operations for all data models.
 *
 * This abstract class handles:
 * - Auto-generation of IDs using nanoid
 * - Auto-setting of createdAt/updatedAt timestamps
 * - Standard CRUD operations (create, read, update, delete)
 * - TypeScript generic support for type safety
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   email: string;
 *   name: string;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 *
 * class UserModel extends BaseModel<User> {
 *   protected tableName = 'users';
 * }
 *
 * const userModel = new UserModel();
 * const user = await userModel.create({ email: 'test@example.com', name: 'Test' });
 * ```
 */
export abstract class BaseModel<T extends { id: string; createdAt?: Date; updatedAt?: Date }> {
  /**
   * The table name in TinyBase store.
   * Must be overridden by subclasses.
   */
  protected abstract tableName: string;

  /**
   * Get the TinyBase store instance.
   * Cached for performance.
   */
  private storeCache?: Store;

  protected async getStore(): Promise<Store> {
    if (!this.storeCache) {
      const db = await getDB();
      this.storeCache = db.store;
    }
    return this.storeCache;
  }

  /**
   * Convert TinyBase row to typed model.
   * Handles date conversion for createdAt/updatedAt fields.
   */
  protected rowToModel(id: string, row: Row): T {
    const model = { id, ...row } as T;

    if (row.createdAt && typeof row.createdAt === 'string') {
      (model as any).createdAt = new Date(row.createdAt);
    }
    if (row.updatedAt && typeof row.updatedAt === 'string') {
      (model as any).updatedAt = new Date(row.updatedAt);
    }

    return model;
  }

  /**
   * Convert typed model to TinyBase row.
   * Handles date serialization for createdAt/updatedAt fields.
   */
  protected modelToRow(data: Partial<T>): Row {
    const row: Row = { ...data };

    if (data.createdAt instanceof Date) {
      row.createdAt = data.createdAt.toISOString();
    }
    if (data.updatedAt instanceof Date) {
      row.updatedAt = data.updatedAt.toISOString();
    }

    delete row.id;

    return row;
  }

  /**
   * Create a new record.
   * Auto-generates ID and sets createdAt/updatedAt timestamps.
   *
   * @param data - The data to create (without id, createdAt, updatedAt)
   * @returns The created record with id, createdAt, updatedAt
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const store = await this.getStore();
    const id = nanoid();
    const now = new Date();

    const record = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as T;

    const row = this.modelToRow(record);
    store.setRow(this.tableName, id, row);

    return record;
  }

  /**
   * Find a record by ID.
   *
   * @param id - The record ID
   * @returns The record or null if not found
   */
  async findById(id: string): Promise<T | null> {
    const store = await this.getStore();
    const row = store.getRow(this.tableName, id);

    if (!row || Object.keys(row).length === 0) {
      return null;
    }

    return this.rowToModel(id, row);
  }

  /**
   * Find multiple records with optional filtering.
   *
   * @param filter - Optional filter function
   * @returns Array of matching records
   */
  async findMany(filter?: (record: T) => boolean): Promise<T[]> {
    const store = await this.getStore();
    const rows = store.getTable(this.tableName);

    const records: T[] = [];
    for (const [id, row] of Object.entries(rows)) {
      const record = this.rowToModel(id, row);
      if (!filter || filter(record)) {
        records.push(record);
      }
    }

    return records;
  }

  /**
   * Update a record by ID.
   * Auto-updates updatedAt timestamp.
   *
   * @param id - The record ID
   * @param data - The data to update (partial)
   * @returns The updated record or null if not found
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T | null> {
    const store = await this.getStore();
    const existingRow = store.getRow(this.tableName, id);

    if (!existingRow || Object.keys(existingRow).length === 0) {
      return null;
    }

    const now = new Date();
    const updatedData = {
      ...data,
      updatedAt: now,
    };

    const row = this.modelToRow(updatedData as Partial<T>);
    store.setPartialRow(this.tableName, id, row);

    const updatedRow = store.getRow(this.tableName, id);
    return this.rowToModel(id, updatedRow);
  }

  /**
   * Delete a record by ID.
   *
   * @param id - The record ID
   * @returns true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const store = await this.getStore();
    const existingRow = store.getRow(this.tableName, id);

    if (!existingRow || Object.keys(existingRow).length === 0) {
      return false;
    }

    store.delRow(this.tableName, id);
    return true;
  }

  /**
   * Count total records.
   *
   * @param filter - Optional filter function
   * @returns Number of matching records
   */
  async count(filter?: (record: T) => boolean): Promise<number> {
    const records = await this.findMany(filter);
    return records.length;
  }

  /**
   * Check if a record exists.
   *
   * @param id - The record ID
   * @returns true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
  }
}
