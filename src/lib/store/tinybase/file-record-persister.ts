import type { Store } from 'tinybase';
import fs from 'fs';
import path from 'path';

export interface IndexDefinition {
  name: string;
  cellId: string;
}

export interface TableConfig {
  tableName: string;
  indexes?: IndexDefinition[];
}

export class FileRecordPersister {
  private dataDir: string;
  private tables: TableConfig[];
  private indexCache: Map<string, Map<string, string[]>> = new Map();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty: Set<string> = new Set();

  constructor(private store: Store, dataDir: string, tables: TableConfig[]) {
    this.dataDir = dataDir;
    this.tables = tables;
  }

  async load(): Promise<void> {
    for (const table of this.tables) {
      const tableDir = path.join(this.dataDir, table.tableName);
      if (!fs.existsSync(tableDir)) continue;

      const files = fs.readdirSync(tableDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
      for (const file of files) {
        const id = file.replace('.json', '');
        try {
          const content = fs.readFileSync(path.join(tableDir, file), 'utf-8');
          const row = JSON.parse(content);
          this.store.setRow(table.tableName, id, row);
        } catch (err) {
          console.error(`Failed to load ${table.tableName}/${file}:`, err);
        }
      }

      this.loadIndexes(table);
    }
  }

  startAutoSave(): void {
    for (const table of this.tables) {
      this.store.addRowListener(table.tableName, null, (_store, tableId, rowId) => {
        this.dirty.add(`${tableId}:${rowId}`);
        this.scheduleSave();
      });
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.flushDirty();
    }, 50);
  }

  private flushDirty(): void {
    const entries = new Set(this.dirty);
    this.dirty.clear();

    for (const entry of entries) {
      const [tableId, rowId] = entry.split(':');
      const row = this.store.getRow(tableId, rowId);

      const tableDir = path.join(this.dataDir, tableId);
      fs.mkdirSync(tableDir, { recursive: true });

      const filePath = path.join(tableDir, `${rowId}.json`);

      if (!row || Object.keys(row).length === 0) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        this.removeFromIndexes(tableId, rowId);
      } else {
        this.atomicWrite(filePath, JSON.stringify(row, null, 2));
        this.updateIndexes(tableId, rowId, row);
      }
    }
  }

  private atomicWrite(filePath: string, content: string): void {
    const tmpFile = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    fs.writeFileSync(tmpFile, content, { mode: 0o600 });
    fs.renameSync(tmpFile, filePath);
  }

  // --- Index management ---

  private indexKey(tableId: string, indexName: string): string {
    return `${tableId}:${indexName}`;
  }

  private getIndex(tableId: string, indexName: string): Map<string, string[]> {
    const key = this.indexKey(tableId, indexName);
    let index = this.indexCache.get(key);
    if (!index) {
      index = new Map();
      this.indexCache.set(key, index);
    }
    return index;
  }

  private loadIndexes(table: TableConfig): void {
    if (!table.indexes) return;

    for (const idx of table.indexes) {
      const indexFile = path.join(this.dataDir, table.tableName, '_index', `${idx.name}.json`);
      const index = this.getIndex(table.tableName, idx.name);

      if (fs.existsSync(indexFile)) {
        try {
          const data: Record<string, string | string[]> = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
          for (const [key, value] of Object.entries(data)) {
            index.set(key, Array.isArray(value) ? value : [value]);
          }
        } catch {
          this.rebuildIndex(table, idx);
        }
      } else {
        this.rebuildIndex(table, idx);
      }
    }
  }

  private rebuildIndex(table: TableConfig, idx: IndexDefinition): void {
    const index = this.getIndex(table.tableName, idx.name);
    index.clear();

    const rowIds = this.store.getRowIds(table.tableName);
    for (const rowId of rowIds) {
      const row = this.store.getRow(table.tableName, rowId);
      const cellValue = String(row[idx.cellId] ?? '');
      if (!cellValue) continue;

      const existing = index.get(cellValue) || [];
      existing.push(rowId);
      index.set(cellValue, existing);
    }

    this.saveIndex(table.tableName, idx.name, index);
  }

  private updateIndexes(tableId: string, rowId: string, row: Record<string, any>): void {
    const table = this.tables.find(t => t.tableName === tableId);
    if (!table?.indexes) return;

    for (const idx of table.indexes) {
      const index = this.getIndex(tableId, idx.name);

      // Remove old entries for this rowId
      for (const [key, ids] of index.entries()) {
        const filtered = ids.filter(id => id !== rowId);
        if (filtered.length === 0) {
          index.delete(key);
        } else {
          index.set(key, filtered);
        }
      }

      // Add new entry
      const cellValue = String(row[idx.cellId] ?? '');
      if (cellValue) {
        const existing = index.get(cellValue) || [];
        existing.push(rowId);
        index.set(cellValue, existing);
      }

      this.saveIndex(tableId, idx.name, index);
    }
  }

  private removeFromIndexes(tableId: string, rowId: string): void {
    const table = this.tables.find(t => t.tableName === tableId);
    if (!table?.indexes) return;

    for (const idx of table.indexes) {
      const index = this.getIndex(tableId, idx.name);

      for (const [key, ids] of index.entries()) {
        const filtered = ids.filter(id => id !== rowId);
        if (filtered.length === 0) {
          index.delete(key);
        } else {
          index.set(key, filtered);
        }
      }

      this.saveIndex(tableId, idx.name, index);
    }
  }

  private saveIndex(tableId: string, indexName: string, index: Map<string, string[]>): void {
    const indexDir = path.join(this.dataDir, tableId, '_index');
    fs.mkdirSync(indexDir, { recursive: true });

    const data: Record<string, string | string[]> = {};
    for (const [key, ids] of index.entries()) {
      data[key] = ids.length === 1 ? ids[0] : ids;
    }

    const indexFile = path.join(indexDir, `${indexName}.json`);
    this.atomicWrite(indexFile, JSON.stringify(data, null, 2));
  }

  // --- Public index lookup API ---

  lookupIndex(tableId: string, indexName: string, value: string): string[] {
    const index = this.getIndex(tableId, indexName);
    return index.get(value) || [];
  }

  async save(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.flushDirty();

    // Also save any rows that haven't been written yet
    for (const table of this.tables) {
      const tableDir = path.join(this.dataDir, table.tableName);
      fs.mkdirSync(tableDir, { recursive: true });

      const rowIds = this.store.getRowIds(table.tableName);
      for (const rowId of rowIds) {
        const filePath = path.join(tableDir, `${rowId}.json`);
        if (!fs.existsSync(filePath)) {
          const row = this.store.getRow(table.tableName, rowId);
          this.atomicWrite(filePath, JSON.stringify(row, null, 2));
          this.updateIndexes(table.tableName, rowId, row);
        }
      }
    }
  }

  async destroy(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.flushDirty();
  }
}
