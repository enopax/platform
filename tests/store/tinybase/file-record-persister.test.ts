import { createStore } from 'tinybase';
import { FileRecordPersister } from '@/lib/store/tinybase/file-record-persister';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('FileRecordPersister', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'persister-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('file-per-record storage', () => {
    it('saves each row as a separate JSON file', async () => {
      const store = createStore();
      const persister = new FileRecordPersister(store, tmpDir, [
        { tableName: 'users' },
      ]);

      store.setRow('users', 'abc123', { name: 'Alice', email: 'alice@example.com' });
      store.setRow('users', 'def456', { name: 'Bob', email: 'bob@example.com' });

      await persister.save();

      expect(fs.existsSync(path.join(tmpDir, 'users', 'abc123.json'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'users', 'def456.json'))).toBe(true);

      const alice = JSON.parse(fs.readFileSync(path.join(tmpDir, 'users', 'abc123.json'), 'utf-8'));
      expect(alice.name).toBe('Alice');
      expect(alice.email).toBe('alice@example.com');

      await persister.destroy();
    });

    it('loads records from individual JSON files', async () => {
      // Write files manually
      fs.mkdirSync(path.join(tmpDir, 'users'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'users', 'id1.json'), JSON.stringify({ name: 'Carol', email: 'carol@example.com' }));
      fs.writeFileSync(path.join(tmpDir, 'users', 'id2.json'), JSON.stringify({ name: 'Dave', email: 'dave@example.com' }));

      const store = createStore();
      const persister = new FileRecordPersister(store, tmpDir, [
        { tableName: 'users' },
      ]);

      await persister.load();

      expect(store.getRow('users', 'id1')).toEqual({ name: 'Carol', email: 'carol@example.com' });
      expect(store.getRow('users', 'id2')).toEqual({ name: 'Dave', email: 'dave@example.com' });

      await persister.destroy();
    });

    it('survives restart — write then load in new store', async () => {
      const store1 = createStore();
      const persister1 = new FileRecordPersister(store1, tmpDir, [
        { tableName: 'items' },
      ]);

      store1.setRow('items', 'item-1', { title: 'First', value: 42 });
      store1.setRow('items', 'item-2', { title: 'Second', value: 99 });
      await persister1.save();
      await persister1.destroy();

      const store2 = createStore();
      const persister2 = new FileRecordPersister(store2, tmpDir, [
        { tableName: 'items' },
      ]);
      await persister2.load();

      expect(store2.getRow('items', 'item-1')).toEqual({ title: 'First', value: 42 });
      expect(store2.getRow('items', 'item-2')).toEqual({ title: 'Second', value: 99 });
      expect(store2.getRowIds('items')).toHaveLength(2);

      await persister2.destroy();
    });

    it('deletes file when row is deleted', async () => {
      const store = createStore();
      const persister = new FileRecordPersister(store, tmpDir, [
        { tableName: 'users' },
      ]);
      persister.startAutoSave();

      store.setRow('users', 'to-delete', { name: 'Gone' });
      await persister.save();
      expect(fs.existsSync(path.join(tmpDir, 'users', 'to-delete.json'))).toBe(true);

      store.delRow('users', 'to-delete');
      // Wait for auto-save debounce
      await new Promise(r => setTimeout(r, 100));

      expect(fs.existsSync(path.join(tmpDir, 'users', 'to-delete.json'))).toBe(false);

      await persister.destroy();
    });
  });

  describe('index files', () => {
    it('creates index files on save', async () => {
      const store = createStore();
      const persister = new FileRecordPersister(store, tmpDir, [
        { tableName: 'users', indexes: [{ name: 'email', cellId: 'email' }] },
      ]);

      store.setRow('users', 'u1', { name: 'Alice', email: 'alice@example.com' });
      store.setRow('users', 'u2', { name: 'Bob', email: 'bob@example.com' });
      await persister.save();

      const indexFile = path.join(tmpDir, 'users', '_index', 'email.json');
      expect(fs.existsSync(indexFile)).toBe(true);

      const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
      expect(index['alice@example.com']).toBe('u1');
      expect(index['bob@example.com']).toBe('u2');

      await persister.destroy();
    });

    it('lookupIndex returns correct row IDs', async () => {
      const store = createStore();
      const persister = new FileRecordPersister(store, tmpDir, [
        { tableName: 'users', indexes: [{ name: 'email', cellId: 'email' }] },
      ]);

      store.setRow('users', 'u1', { name: 'Alice', email: 'alice@example.com' });
      store.setRow('users', 'u2', { name: 'Bob', email: 'bob@example.com' });
      await persister.save();

      expect(persister.lookupIndex('users', 'email', 'alice@example.com')).toEqual(['u1']);
      expect(persister.lookupIndex('users', 'email', 'bob@example.com')).toEqual(['u2']);
      expect(persister.lookupIndex('users', 'email', 'nobody@example.com')).toEqual([]);

      await persister.destroy();
    });

    it('index survives restart', async () => {
      const store1 = createStore();
      const persister1 = new FileRecordPersister(store1, tmpDir, [
        { tableName: 'users', indexes: [{ name: 'email', cellId: 'email' }] },
      ]);
      store1.setRow('users', 'u1', { name: 'Alice', email: 'alice@example.com' });
      await persister1.save();
      await persister1.destroy();

      const store2 = createStore();
      const persister2 = new FileRecordPersister(store2, tmpDir, [
        { tableName: 'users', indexes: [{ name: 'email', cellId: 'email' }] },
      ]);
      await persister2.load();

      expect(persister2.lookupIndex('users', 'email', 'alice@example.com')).toEqual(['u1']);

      await persister2.destroy();
    });

    it('index updates on auto-save after row change', async () => {
      const store = createStore();
      const persister = new FileRecordPersister(store, tmpDir, [
        { tableName: 'users', indexes: [{ name: 'email', cellId: 'email' }] },
      ]);
      persister.startAutoSave();

      store.setRow('users', 'u1', { name: 'Alice', email: 'alice@example.com' });
      await new Promise(r => setTimeout(r, 100));

      expect(persister.lookupIndex('users', 'email', 'alice@example.com')).toEqual(['u1']);

      // Update email
      store.setRow('users', 'u1', { name: 'Alice', email: 'newalice@example.com' });
      await new Promise(r => setTimeout(r, 100));

      expect(persister.lookupIndex('users', 'email', 'alice@example.com')).toEqual([]);
      expect(persister.lookupIndex('users', 'email', 'newalice@example.com')).toEqual(['u1']);

      await persister.destroy();
    });

    it('index removes entry on row delete', async () => {
      const store = createStore();
      const persister = new FileRecordPersister(store, tmpDir, [
        { tableName: 'users', indexes: [{ name: 'email', cellId: 'email' }] },
      ]);
      persister.startAutoSave();

      store.setRow('users', 'u1', { name: 'Alice', email: 'alice@example.com' });
      await new Promise(r => setTimeout(r, 100));
      expect(persister.lookupIndex('users', 'email', 'alice@example.com')).toEqual(['u1']);

      store.delRow('users', 'u1');
      await new Promise(r => setTimeout(r, 100));
      expect(persister.lookupIndex('users', 'email', 'alice@example.com')).toEqual([]);

      await persister.destroy();
    });

    it('supports multi-value indexes (same cell value, multiple rows)', async () => {
      const store = createStore();
      const persister = new FileRecordPersister(store, tmpDir, [
        { tableName: 'members', indexes: [{ name: 'orgId', cellId: 'organisationId' }] },
      ]);

      store.setRow('members', 'm1', { userId: 'u1', organisationId: 'org-1' });
      store.setRow('members', 'm2', { userId: 'u2', organisationId: 'org-1' });
      store.setRow('members', 'm3', { userId: 'u3', organisationId: 'org-2' });
      await persister.save();

      const org1Members = persister.lookupIndex('members', 'orgId', 'org-1');
      expect(org1Members.sort()).toEqual(['m1', 'm2']);
      expect(persister.lookupIndex('members', 'orgId', 'org-2')).toEqual(['m3']);

      await persister.destroy();
    });
  });
});
