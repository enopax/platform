/**
 * TinyBase Custom File Persister Tests
 *
 * Tests for file-per-record storage with atomic writes and JSONL indices.
 *
 * Test Coverage:
 * 1. Save single record creates file
 * 2. Save multiple records creates multiple files
 * 3. Update record updates existing file atomically
 * 4. Delete record removes file
 * 5. Crash simulation: kill process during save, no corruption
 * 6. Index created and updated correctly
 * 7. Load after save recovers all data
 */

import { createStore } from 'tinybase';
import { createFilePerRecordPersister } from '../persister';
import { existsSync } from 'fs';
import { readFile, readdir, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

// Test data directory
const TEST_DATA_PATH = join(__dirname, 'test-data');

// Cleanup helper
const cleanupTestData = async () => {
  if (existsSync(TEST_DATA_PATH)) {
    await rm(TEST_DATA_PATH, { recursive: true, force: true });
  }
};

describe('TinyBase File Persister - Basic Operations', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  // ============================================
  // Test 1: Save single record creates file
  // ============================================
  test('should save single record and create file', async () => {
    const store = createStore();
    const persister = createFilePerRecordPersister(store, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: [] }
      }
    });

    await persister.load();

    // Add a user
    store.setRow('users', 'user-1', {
      email: 'alice@example.com',
      name: 'Alice'
    });

    // Save
    await persister.save();

    // Verify file exists
    const filePath = join(TEST_DATA_PATH, 'users', 'user-1.json');
    expect(existsSync(filePath)).toBe(true);

    // Verify file content
    const fileContent = await readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    expect(data.email).toBe('alice@example.com');
    expect(data.name).toBe('Alice');
  });

  // ============================================
  // Test 2: Save multiple records creates multiple files
  // ============================================
  test('should save multiple records and create multiple files', async () => {
    const store = createStore();
    const persister = createFilePerRecordPersister(store, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: [] }
      }
    });

    await persister.load();

    // Add multiple users
    store.setRow('users', 'user-1', { email: 'alice@example.com', name: 'Alice' });
    store.setRow('users', 'user-2', { email: 'bob@example.com', name: 'Bob' });
    store.setRow('users', 'user-3', { email: 'carol@example.com', name: 'Carol' });

    // Save
    await persister.save();

    // Verify all files exist
    const usersPath = join(TEST_DATA_PATH, 'users');
    const files = await readdir(usersPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    expect(jsonFiles).toHaveLength(3);
    expect(jsonFiles).toContain('user-1.json');
    expect(jsonFiles).toContain('user-2.json');
    expect(jsonFiles).toContain('user-3.json');
  });

  // ============================================
  // Test 3: Update record updates existing file atomically
  // ============================================
  test('should update record atomically', async () => {
    const store = createStore();
    const persister = createFilePerRecordPersister(store, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: [] }
      }
    });

    await persister.load();

    // Create initial record
    store.setRow('users', 'user-1', { email: 'alice@example.com', name: 'Alice' });
    await persister.save();

    // Update record
    store.setRow('users', 'user-1', { email: 'alice@example.com', name: 'Alice Updated' });
    await persister.save();

    // Verify file content was updated
    const filePath = join(TEST_DATA_PATH, 'users', 'user-1.json');
    const fileContent = await readFile(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    expect(data.name).toBe('Alice Updated');
    expect(data.email).toBe('alice@example.com');
  });

  // ============================================
  // Test 4: Delete record removes file
  // ============================================
  test('should delete record and remove file', async () => {
    const store = createStore();
    const persister = createFilePerRecordPersister(store, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: [] }
      }
    });

    await persister.load();

    // Create record
    store.setRow('users', 'user-1', { email: 'alice@example.com', name: 'Alice' });
    await persister.save();

    const filePath = join(TEST_DATA_PATH, 'users', 'user-1.json');
    expect(existsSync(filePath)).toBe(true);

    // Delete record
    store.delRow('users', 'user-1');
    await persister.save();

    // Verify file is gone
    expect(existsSync(filePath)).toBe(false);
  });

  // ============================================
  // Test 5: Crash simulation - atomic rename pattern
  // ============================================
  test('should not corrupt data during interrupted save', async () => {
    const store = createStore();
    const persister = createFilePerRecordPersister(store, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: [] }
      }
    });

    await persister.load();

    // Create initial record
    store.setRow('users', 'user-1', { email: 'alice@example.com', name: 'Alice' });
    await persister.save();

    // Simulate crash: create a .tmp file that would be left behind
    const filePath = join(TEST_DATA_PATH, 'users', 'user-1.json');
    const tmpPath = `${filePath}.tmp`;

    // Write corrupted data to .tmp file
    await writeFile(tmpPath, '{ "corrupted": "data"', 'utf8');

    // Load - should load from .json file, ignoring .tmp
    const newStore = createStore();
    const newPersister = createFilePerRecordPersister(newStore, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: [] }
      }
    });

    await newPersister.load();

    // Verify data is intact
    const user = newStore.getRow('users', 'user-1');
    expect(user?.email).toBe('alice@example.com');
    expect(user?.name).toBe('Alice');
  });

  // ============================================
  // Test 6: Index created and updated correctly
  // ============================================
  test('should create and update JSONL indices', async () => {
    const store = createStore();
    const persister = createFilePerRecordPersister(store, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: ['email', 'name'] }
      }
    });

    await persister.load();

    // Add users
    store.setRow('users', 'user-1', { email: 'alice@example.com', name: 'Alice' });
    store.setRow('users', 'user-2', { email: 'bob@example.com', name: 'Bob' });

    // Save
    await persister.save();

    // Verify email index exists
    const emailIndexPath = join(TEST_DATA_PATH, 'users', 'indices', 'email.jsonl');
    expect(existsSync(emailIndexPath)).toBe(true);

    // Verify email index content
    const emailIndexContent = await readFile(emailIndexPath, 'utf8');
    const emailIndexLines = emailIndexContent.trim().split('\n');
    expect(emailIndexLines).toHaveLength(2);

    const emailIndex = emailIndexLines.map(line => JSON.parse(line));
    expect(emailIndex).toContainEqual({ key: 'alice@example.com', rowId: 'user-1' });
    expect(emailIndex).toContainEqual({ key: 'bob@example.com', rowId: 'user-2' });

    // Verify name index exists
    const nameIndexPath = join(TEST_DATA_PATH, 'users', 'indices', 'name.jsonl');
    expect(existsSync(nameIndexPath)).toBe(true);

    const nameIndexContent = await readFile(nameIndexPath, 'utf8');
    const nameIndexLines = nameIndexContent.trim().split('\n');
    expect(nameIndexLines).toHaveLength(2);

    const nameIndex = nameIndexLines.map(line => JSON.parse(line));
    expect(nameIndex).toContainEqual({ key: 'Alice', rowId: 'user-1' });
    expect(nameIndex).toContainEqual({ key: 'Bob', rowId: 'user-2' });
  });

  // ============================================
  // Test 7: Load after save recovers all data
  // ============================================
  test('should load all data after save', async () => {
    // First store: create and save data
    const store1 = createStore();
    const persister1 = createFilePerRecordPersister(store1, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: ['email'] },
        organisations: { indexed: ['name'] }
      }
    });

    await persister1.load();

    // Add data to multiple collections
    store1.setRow('users', 'user-1', { email: 'alice@example.com', name: 'Alice' });
    store1.setRow('users', 'user-2', { email: 'bob@example.com', name: 'Bob' });
    store1.setRow('organisations', 'org-1', { name: 'Acme Corp', ownerId: 'user-1' });
    store1.setRow('organisations', 'org-2', { name: 'Beta Inc', ownerId: 'user-2' });

    await persister1.save();

    // Second store: load data
    const store2 = createStore();
    const persister2 = createFilePerRecordPersister(store2, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: ['email'] },
        organisations: { indexed: ['name'] }
      }
    });

    await persister2.load();

    // Verify all users loaded
    const user1 = store2.getRow('users', 'user-1');
    const user2 = store2.getRow('users', 'user-2');
    expect(user1?.email).toBe('alice@example.com');
    expect(user2?.email).toBe('bob@example.com');

    // Verify all organisations loaded
    const org1 = store2.getRow('organisations', 'org-1');
    const org2 = store2.getRow('organisations', 'org-2');
    expect(org1?.name).toBe('Acme Corp');
    expect(org2?.name).toBe('Beta Inc');
  });
});

describe('TinyBase File Persister - Auto-Save', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  test('should auto-save changes after interval', async () => {
    const store = createStore();
    const persister = createFilePerRecordPersister(store, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: [] }
      }
    });

    await persister.load();
    await persister.startAutoSave();

    // Add data
    store.setRow('users', 'user-1', { email: 'alice@example.com', name: 'Alice' });

    // Wait for auto-save (default 2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Verify file exists
    const filePath = join(TEST_DATA_PATH, 'users', 'user-1.json');
    expect(existsSync(filePath)).toBe(true);

    // Stop auto-save
    await persister.stopAutoSave();
  });
});

describe('TinyBase File Persister - Values Storage', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  test('should save and load global values', async () => {
    const store = createStore();
    const persister = createFilePerRecordPersister(store, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: [] }
      }
    });

    await persister.load();

    // Set global values
    store.setValue('appVersion', '1.0.0');
    store.setValue('dbVersion', 42);

    await persister.save();

    // Verify _values.json exists
    const valuesPath = join(TEST_DATA_PATH, '_values.json');
    expect(existsSync(valuesPath)).toBe(true);

    // Load in new store
    const store2 = createStore();
    const persister2 = createFilePerRecordPersister(store2, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: [] }
      }
    });

    await persister2.load();

    expect(store2.getValue('appVersion')).toBe('1.0.0');
    expect(store2.getValue('dbVersion')).toBe(42);
  });
});

describe('TinyBase File Persister - Multiple Collections', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  test('should handle multiple collections with different configs', async () => {
    const store = createStore();
    const persister = createFilePerRecordPersister(store, {
      dataPath: TEST_DATA_PATH,
      collections: {
        users: { indexed: ['email'] },
        organisations: { indexed: ['name', 'slug'] },
        teams: { indexed: ['organisationId'] }
      }
    });

    await persister.load();

    // Add data to different collections
    store.setRow('users', 'user-1', { email: 'alice@example.com', name: 'Alice' });
    store.setRow('organisations', 'org-1', { name: 'Acme', slug: 'acme', ownerId: 'user-1' });
    store.setRow('teams', 'team-1', { name: 'Engineering', organisationId: 'org-1' });

    await persister.save();

    // Verify directory structure
    expect(existsSync(join(TEST_DATA_PATH, 'users', 'user-1.json'))).toBe(true);
    expect(existsSync(join(TEST_DATA_PATH, 'organisations', 'org-1.json'))).toBe(true);
    expect(existsSync(join(TEST_DATA_PATH, 'teams', 'team-1.json'))).toBe(true);

    // Verify indices
    expect(existsSync(join(TEST_DATA_PATH, 'users', 'indices', 'email.jsonl'))).toBe(true);
    expect(existsSync(join(TEST_DATA_PATH, 'organisations', 'indices', 'name.jsonl'))).toBe(true);
    expect(existsSync(join(TEST_DATA_PATH, 'organisations', 'indices', 'slug.jsonl'))).toBe(true);
    expect(existsSync(join(TEST_DATA_PATH, 'teams', 'indices', 'organisationId.jsonl'))).toBe(true);
  });
});
