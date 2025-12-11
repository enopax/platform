# Per-Collection Storage Strategies & Write-Ahead Log (WAL)

**Date:** 2025-12-10
**Context:** TinyBase Custom Persister Implementation

---

## 🎯 Part 1: Per-Collection Storage Strategies

### ✅ YES - You Can Store Each Collection Differently!

TinyBase gives you the **entire store content** in your custom persister, so you can decide:
- Which collections to save to files
- Which collections to keep in memory only
- Different file formats per collection
- Different storage backends per collection

### TinyBase Data Structure

```typescript
type Content = [
  Tables,  // All collections
  Values   // Global key-value store
];

type Tables = {
  [tableId: string]: {
    [rowId: string]: Row
  }
};

// Example:
const content: Content = [
  {
    users: {      // Collection 1
      'uuid-1': { email: 'alice@example.com', name: 'Alice' },
      'uuid-2': { email: 'bob@example.com', name: 'Bob' }
    },
    orders: {     // Collection 2
      'order-1': { userId: 'uuid-1', total: 100 },
      'order-2': { userId: 'uuid-2', total: 200 }
    },
    sessions: {   // Collection 3 (temporary)
      'session-1': { userId: 'uuid-1', expiresAt: 1234567890 }
    }
  },
  {
    appVersion: '1.0.0',
    lastBackup: '2025-12-10'
  }
];
```

---

## 📁 Strategy 1: Different Storage Per Collection

### Configuration

```typescript
interface CollectionStorageConfig {
  [collectionName: string]: {
    strategy: 'file-per-record' | 'single-file' | 'memory-only' | 'compressed';
    path?: string;
    indexed?: string[];  // Fields to index
    ttl?: number;        // Time-to-live in seconds
  };
}

const storageConfig: CollectionStorageConfig = {
  users: {
    strategy: 'file-per-record',
    path: '/data/users',
    indexed: ['email', 'username']
  },
  orders: {
    strategy: 'file-per-record',
    path: '/data/orders',
    indexed: ['userId', 'status']
  },
  sessions: {
    strategy: 'memory-only',  // Don't persist to disk
    ttl: 3600  // 1 hour
  },
  logs: {
    strategy: 'single-file',  // Append-only
    path: '/data/logs/app.jsonl'
  },
  cache: {
    strategy: 'compressed',   // LZ4 compressed
    path: '/data/cache'
  }
};
```

### Implementation

```typescript
import {createCustomPersister} from 'tinybase/persisters';
import {readFile, writeFile, rename, readdir, appendFile} from 'fs/promises';
import {join} from 'path';
import LZ4 from 'lz4';

export const createMultiStrategyPersister = (
  store: Store,
  config: CollectionStorageConfig,
  dataPath: string = '/data'
) => {

  // ============================================
  // LOAD: Read each collection with its strategy
  // ============================================
  const getPersisted = async (): Promise<Content | undefined> => {
    const tables: Tables = {};
    const values: Values = {};

    for (const [collectionName, collectionConfig] of Object.entries(config)) {

      // Skip memory-only collections
      if (collectionConfig.strategy === 'memory-only') {
        continue;
      }

      const collectionPath = collectionConfig.path || join(dataPath, collectionName);

      switch (collectionConfig.strategy) {

        // ==========================================
        // Strategy 1: File-per-record
        // ==========================================
        case 'file-per-record': {
          tables[collectionName] = {};

          try {
            const files = await readdir(collectionPath);

            for (const file of files) {
              if (!file.endsWith('.json')) continue;

              const rowId = file.replace('.json', '');
              const filePath = join(collectionPath, file);
              const data = await readFile(filePath, 'utf8');
              tables[collectionName][rowId] = JSON.parse(data);
            }
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
          }
          break;
        }

        // ==========================================
        // Strategy 2: Single file (entire collection)
        // ==========================================
        case 'single-file': {
          try {
            const data = await readFile(collectionPath, 'utf8');

            // JSONL format (one record per line)
            if (collectionPath.endsWith('.jsonl')) {
              tables[collectionName] = {};
              const lines = data.split('\n').filter(line => line.trim());

              for (const line of lines) {
                const record = JSON.parse(line);
                const rowId = record.id || record._id || generateId();
                tables[collectionName][rowId] = record;
              }
            }
            // Regular JSON format
            else {
              tables[collectionName] = JSON.parse(data);
            }
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
          }
          break;
        }

        // ==========================================
        // Strategy 3: Compressed
        // ==========================================
        case 'compressed': {
          try {
            const compressed = await readFile(collectionPath + '.lz4');
            const decompressed = LZ4.decode(compressed);
            tables[collectionName] = JSON.parse(decompressed.toString('utf8'));
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
          }
          break;
        }
      }
    }

    // Load global values
    const valuesPath = join(dataPath, '_values.json');
    try {
      const valuesData = await readFile(valuesPath, 'utf8');
      Object.assign(values, JSON.parse(valuesData));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    return [tables, values];
  };

  // ============================================
  // SAVE: Write each collection with its strategy
  // ============================================
  const setPersisted = async (
    getContent: () => Content,
    changes?: Changes
  ): Promise<void> => {
    const [tables, values] = getContent();

    // If we have changes, only save changed collections
    const changedCollections = changes
      ? Object.keys(changes[0])  // [0] is changedTables
      : Object.keys(tables);     // No changes = save all

    for (const collectionName of changedCollections) {
      const collectionConfig = config[collectionName];

      if (!collectionConfig) {
        console.warn(`No storage config for collection: ${collectionName}`);
        continue;
      }

      // Skip memory-only collections
      if (collectionConfig.strategy === 'memory-only') {
        continue;
      }

      const collectionPath = collectionConfig.path || join(dataPath, collectionName);
      const collectionData = tables[collectionName] || {};

      switch (collectionConfig.strategy) {

        // ==========================================
        // Strategy 1: File-per-record (with atomic writes)
        // ==========================================
        case 'file-per-record': {
          await mkdir(collectionPath, {recursive: true});

          // Get changed rows if available
          const changedRows = changes?.[0][collectionName] || collectionData;

          for (const [rowId, rowData] of Object.entries(changedRows)) {
            const filePath = join(collectionPath, `${rowId}.json`);
            const tmpPath = `${filePath}.tmp`;

            // Check if row was deleted
            if (changes?.[0][collectionName]?.[rowId]?.[1] === true) {
              // Row deleted - remove file
              await unlink(filePath).catch(() => {});
              continue;
            }

            // Get actual row data from tables (changes only has metadata)
            const actualRow = tables[collectionName]?.[rowId];
            if (!actualRow) continue;

            // Atomic write: temp file + rename
            await writeFile(tmpPath, JSON.stringify(actualRow, null, 2), 'utf8');
            await rename(tmpPath, filePath);
          }

          // Update indices for this collection
          if (collectionConfig.indexed) {
            await updateIndices(
              collectionPath,
              collectionName,
              collectionData,
              collectionConfig.indexed
            );
          }
          break;
        }

        // ==========================================
        // Strategy 2: Single file (entire collection)
        // ==========================================
        case 'single-file': {
          const tmpPath = `${collectionPath}.tmp`;

          // JSONL format
          if (collectionPath.endsWith('.jsonl')) {
            const lines = Object.entries(collectionData)
              .map(([rowId, row]) => JSON.stringify({id: rowId, ...row}))
              .join('\n');

            await writeFile(tmpPath, lines, 'utf8');
          }
          // Regular JSON
          else {
            await writeFile(tmpPath, JSON.stringify(collectionData, null, 2), 'utf8');
          }

          // Atomic rename
          await rename(tmpPath, collectionPath);
          break;
        }

        // ==========================================
        // Strategy 3: Compressed
        // ==========================================
        case 'compressed': {
          const json = JSON.stringify(collectionData);
          const compressed = LZ4.encode(Buffer.from(json, 'utf8'));

          const tmpPath = `${collectionPath}.lz4.tmp`;
          await writeFile(tmpPath, compressed);
          await rename(tmpPath, `${collectionPath}.lz4`);
          break;
        }
      }
    }

    // Save global values
    if (Object.keys(values).length > 0) {
      const valuesPath = join(dataPath, '_values.json');
      const tmpPath = `${valuesPath}.tmp`;
      await writeFile(tmpPath, JSON.stringify(values, null, 2), 'utf8');
      await rename(tmpPath, valuesPath);
    }
  };

  // ============================================
  // HELPER: Update JSONL indices
  // ============================================
  const updateIndices = async (
    collectionPath: string,
    collectionName: string,
    collectionData: Record<string, any>,
    indexedFields: string[]
  ) => {
    const indicesPath = join(collectionPath, 'indices');
    await mkdir(indicesPath, {recursive: true});

    for (const field of indexedFields) {
      const indexPath = join(indicesPath, `${field}.jsonl`);
      const indexLines: string[] = [];

      // Build index
      for (const [rowId, row] of Object.entries(collectionData)) {
        if (row[field] !== undefined) {
          indexLines.push(JSON.stringify({
            key: row[field],
            rowId: rowId
          }));
        }
      }

      // Atomic write
      const tmpPath = `${indexPath}.tmp`;
      await writeFile(tmpPath, indexLines.join('\n'), 'utf8');
      await rename(tmpPath, indexPath);
    }
  };

  // Create persister
  return createCustomPersister(
    store,
    getPersisted,
    setPersisted,
    () => {}, // No listener
    () => {}  // No cleanup
  );
};
```

### Usage Example

```typescript
import {createStore} from 'tinybase';
import {createMultiStrategyPersister} from './multi-strategy-persister';

const store = createStore();

const persister = createMultiStrategyPersister(store, {
  // Users: File per record with indices
  users: {
    strategy: 'file-per-record',
    path: '/data/users',
    indexed: ['email', 'username']
  },

  // Orders: File per record with indices
  orders: {
    strategy: 'file-per-record',
    path: '/data/orders',
    indexed: ['userId', 'status', 'createdAt']
  },

  // Sessions: Memory only (don't persist)
  sessions: {
    strategy: 'memory-only',
    ttl: 3600
  },

  // Audit logs: Single JSONL file (append-only)
  auditLogs: {
    strategy: 'single-file',
    path: '/data/logs/audit.jsonl'
  },

  // Cache: Compressed
  cache: {
    strategy: 'compressed',
    path: '/data/cache/app'
  }
});

await persister.load();
await persister.startAutoSave();

// Use it!
store.setRow('users', uuid(), { email: 'alice@example.com' });
store.setRow('sessions', uuid(), { userId: 'user-1', expiresAt: Date.now() + 3600000 });
store.setRow('auditLogs', uuid(), { action: 'login', userId: 'user-1', timestamp: Date.now() });

// After 2s:
// - /data/users/<uuid>.json (persisted)
// - /data/users/indices/email.jsonl (persisted)
// - sessions NOT persisted (memory-only)
// - /data/logs/audit.jsonl (appended)
```

### Result Directory Structure

```
/data/
├── users/
│   ├── 550e8400-e29b-41d4-a906-446655440000.json
│   ├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.json
│   └── indices/
│       ├── email.jsonl
│       └── username.jsonl
├── orders/
│   ├── order-001.json
│   ├── order-002.json
│   └── indices/
│       ├── userId.jsonl
│       └── status.jsonl
├── logs/
│   └── audit.jsonl
├── cache/
│   └── app.lz4
└── _values.json
```

---

## 🔥 Part 2: Write-Ahead Log (WAL) Explained

### What Is WAL?

**Write-Ahead Log** is a technique used by databases (PostgreSQL, SQLite, etc.) to ensure **durability** and enable **crash recovery**.

**Core Principle:**
> Before modifying data, write the change to a log file first. If the system crashes, replay the log to recover.

### Why WAL?

**Problem without WAL:**
```
1. User saves order: {id: 'order-1', total: 100}
2. App crashes before writing to disk
3. Data lost! ❌
```

**Solution with WAL:**
```
1. User saves order: {id: 'order-1', total: 100}
2. FIRST: Write change to WAL file (fast, append-only)
3. THEN: Update data file (slow, can be batched)
4. If crash happens at step 3, replay WAL on startup ✅
```

---

### How WAL Works

#### Step 1: Write to WAL (Immediate)

```typescript
// Every change is immediately written to WAL
const appendToWAL = async (change: Change) => {
  const walPath = '/data/_wal.jsonl';

  // Append to WAL file (fast, sequential write)
  await appendFile(
    walPath,
    JSON.stringify({
      lsn: nextLSN++,        // Log Sequence Number
      timestamp: Date.now(),
      operation: change.operation,  // 'insert', 'update', 'delete'
      table: change.table,
      rowId: change.rowId,
      data: change.data
    }) + '\n',
    'utf8'
  );

  // Optionally: fsync to force to disk immediately
  await fsync(walPath);
};

// Usage:
store.setRow('users', 'user-1', {email: 'alice@example.com'});
await appendToWAL({
  operation: 'insert',
  table: 'users',
  rowId: 'user-1',
  data: {email: 'alice@example.com'}
});
// ✅ Change is now durable (even if app crashes)
```

#### Step 2: Batch Write to Data Files (Delayed)

```typescript
// Every 2 seconds, flush changes to actual data files
setInterval(async () => {
  await persister.save();  // Batch write
  await truncateWAL();     // Clear WAL after successful save
}, 2000);
```

#### Step 3: Replay WAL on Startup (Crash Recovery)

```typescript
const replayWAL = async () => {
  const walPath = '/data/_wal.jsonl';

  if (!existsSync(walPath)) {
    return; // No WAL, nothing to recover
  }

  console.log('🔄 Replaying WAL for crash recovery...');

  const walData = await readFile(walPath, 'utf8');
  const entries = walData.split('\n').filter(line => line.trim());

  for (const line of entries) {
    const entry = JSON.parse(line);

    switch (entry.operation) {
      case 'insert':
      case 'update':
        store.setRow(entry.table, entry.rowId, entry.data);
        break;
      case 'delete':
        store.delRow(entry.table, entry.rowId);
        break;
    }
  }

  console.log(`✅ Replayed ${entries.length} WAL entries`);

  // After replay, save to data files
  await persister.save();

  // Clear WAL
  await unlink(walPath);
};

// On startup:
await replayWAL();
await persister.load();
```

---

### Full WAL Implementation

```typescript
import {createCustomPersister} from 'tinybase/persisters';
import {appendFile, readFile, writeFile, rename, unlink} from 'fs/promises';
import {existsSync} from 'fs';
import {join} from 'path';

let walLSN = 0; // Log Sequence Number

export const createWALPersister = (
  store: Store,
  dataPath: string = '/data',
  walPath: string = '/data/_wal.jsonl'
) => {

  // ============================================
  // WAL: Append change to log
  // ============================================
  const appendToWAL = async (
    operation: 'insert' | 'update' | 'delete',
    table: string,
    rowId: string,
    data?: any
  ) => {
    const entry = {
      lsn: walLSN++,
      timestamp: Date.now(),
      operation,
      table,
      rowId,
      data
    };

    await appendFile(walPath, JSON.stringify(entry) + '\n', 'utf8');
  };

  // ============================================
  // WAL: Replay on startup
  // ============================================
  const replayWAL = async () => {
    if (!existsSync(walPath)) {
      return;
    }

    console.log('🔄 Replaying WAL...');

    const walData = await readFile(walPath, 'utf8');
    const entries = walData.split('\n').filter(line => line.trim());

    for (const line of entries) {
      const entry = JSON.parse(line);

      switch (entry.operation) {
        case 'insert':
        case 'update':
          store.setRow(entry.table, entry.rowId, entry.data);
          break;
        case 'delete':
          store.delRow(entry.table, entry.rowId);
          break;
      }
    }

    console.log(`✅ Replayed ${entries.length} entries`);
  };

  // ============================================
  // WAL: Truncate after successful save
  // ============================================
  const truncateWAL = async () => {
    if (existsSync(walPath)) {
      await unlink(walPath);
    }
    walLSN = 0;
  };

  // ============================================
  // LOAD: Load from data files
  // ============================================
  const getPersisted = async (): Promise<Content | undefined> => {
    // First: Replay WAL to recover any uncommitted changes
    await replayWAL();

    // Then: Load from data files
    const tables: Tables = {};
    const values: Values = {};

    // Load users
    const usersPath = join(dataPath, 'users');
    if (existsSync(usersPath)) {
      const files = await readdir(usersPath);
      tables.users = {};

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const rowId = file.replace('.json', '');
        const data = await readFile(join(usersPath, file), 'utf8');
        tables.users[rowId] = JSON.parse(data);
      }
    }

    // Load values
    const valuesPath = join(dataPath, '_values.json');
    if (existsSync(valuesPath)) {
      const valuesData = await readFile(valuesPath, 'utf8');
      Object.assign(values, JSON.parse(valuesData));
    }

    return [tables, values];
  };

  // ============================================
  // SAVE: Write to data files + truncate WAL
  // ============================================
  const setPersisted = async (
    getContent: () => Content,
    changes?: Changes
  ): Promise<void> => {
    const [tables, values] = getContent();

    // Write changed records to data files
    if (changes) {
      const [changedTables] = changes;

      for (const [tableName, changedRows] of Object.entries(changedTables)) {
        const tablePath = join(dataPath, tableName);
        await mkdir(tablePath, {recursive: true});

        for (const [rowId, [cellChanges, wasDeleted]] of Object.entries(changedRows)) {
          const filePath = join(tablePath, `${rowId}.json`);

          if (wasDeleted) {
            await unlink(filePath).catch(() => {});
          } else {
            const row = tables[tableName]?.[rowId];
            if (row) {
              const tmpPath = `${filePath}.tmp`;
              await writeFile(tmpPath, JSON.stringify(row, null, 2), 'utf8');
              await rename(tmpPath, filePath);
            }
          }
        }
      }
    }

    // Save values
    const valuesPath = join(dataPath, '_values.json');
    const tmpValuesPath = `${valuesPath}.tmp`;
    await writeFile(tmpValuesPath, JSON.stringify(values, null, 2), 'utf8');
    await rename(tmpValuesPath, valuesPath);

    // After successful save, truncate WAL
    await truncateWAL();
  };

  // ============================================
  // INTERCEPT: Hook into store changes
  // ============================================
  const startWAL = () => {
    // Listen to all table changes
    store.addTablesListener((store, tableId) => {
      // Get changed tables
      const changes = store.getTransactionChanges();
      const [changedTables] = changes;

      // Append to WAL
      for (const [tableName, changedRows] of Object.entries(changedTables)) {
        for (const [rowId, [cellChanges, wasDeleted]] of Object.entries(changedRows)) {
          if (wasDeleted) {
            appendToWAL('delete', tableName, rowId);
          } else {
            const row = store.getRow(tableName, rowId);
            appendToWAL('update', tableName, rowId, row);
          }
        }
      }
    });
  };

  // Start WAL
  startWAL();

  return createCustomPersister(
    store,
    getPersisted,
    setPersisted,
    () => {},
    () => {}
  );
};
```

### Usage Example

```typescript
import {createStore} from 'tinybase';
import {createWALPersister} from './wal-persister';

const store = createStore();
const persister = createWALPersister(store, '/data');

// Load (includes WAL replay)
await persister.load();

// Start auto-save (batch writes every 2s)
await persister.startAutoSave();

// Use the store
store.setRow('users', 'user-1', {email: 'alice@example.com'});
// ✅ Immediately written to WAL
// ⏱️ Written to data files after 2s

// If app crashes here, WAL will replay on next startup
```

---

## 📊 WAL Benefits & Trade-offs

### Benefits

| Benefit | Description |
|---------|-------------|
| **Zero data loss** | Every change is logged immediately |
| **Fast writes** | Append-only writes are fast (sequential I/O) |
| **Crash recovery** | Automatic recovery on startup |
| **Durability** | Data survives crashes and power loss |

### Trade-offs

| Trade-off | Impact |
|-----------|--------|
| **Extra disk I/O** | Every change writes to WAL + data file |
| **WAL file grows** | Need to truncate after successful save |
| **Replay time** | Startup slower if WAL is large |
| **Complexity** | More code to maintain |

---

## 🎯 When to Use WAL

### ✅ **Use WAL for:**

- Financial transactions
- User authentication/authorization changes
- Order processing
- Critical configuration changes
- Any data that MUST NOT be lost

### ⚠️ **Skip WAL for:**

- Cache data
- Temporary sessions
- Analytics/metrics (can tolerate loss)
- High-frequency writes (10,000+ writes/sec)

---

## 💡 Hybrid Approach (Recommended)

Combine strategies for best results:

```typescript
const storageConfig = {
  // Critical: WAL + File-per-record
  users: {
    strategy: 'file-per-record',
    wal: true,  // Enable WAL
    indexed: ['email']
  },

  // Important: File-per-record + 2s batching (no WAL)
  orders: {
    strategy: 'file-per-record',
    wal: false,  // 2s loss window acceptable
    indexed: ['userId', 'status']
  },

  // Temporary: Memory-only (no persistence)
  sessions: {
    strategy: 'memory-only'
  },

  // Logs: Append-only JSONL
  auditLogs: {
    strategy: 'single-file',
    path: '/data/logs/audit.jsonl',
    wal: true  // Never lose audit logs
  }
};
```

---

## 📈 Performance Comparison

| Strategy | Write Latency | Data Loss Window | Crash-Safe |
|----------|---------------|------------------|------------|
| **Direct write** | ~1ms | None (if successful) | ❌ |
| **Atomic rename** | ~2ms | Up to 2s (batch) | ✅ |
| **WAL** | ~3-5ms | None | ✅✅ |
| **WAL + fsync** | ~10-50ms | None | ✅✅✅ |

---

## 🚀 Summary

### Per-Collection Storage

**YES! ✅** You can store each collection differently:
- File-per-record for `users`, `orders`
- Memory-only for `sessions`
- Single JSONL file for `logs`
- Compressed for `cache`

**Implementation:** ~300-400 lines of code

---

### Write-Ahead Log (WAL)

**What:** Log changes before writing to data files
**Why:** Zero data loss, crash recovery
**How:** Append to WAL → Batch write to files → Truncate WAL
**Cost:** ~3-5ms write latency (vs 2ms without WAL)

**Use for:** Critical data that MUST NOT be lost
**Skip for:** Temporary data, caches, high-frequency writes

---

## 🎯 Recommended Architecture for Enopax

```typescript
const persister = createMultiStrategyPersister(store, {
  // Users: Critical - WAL + File-per-record
  users: {
    strategy: 'file-per-record',
    path: '/data/users',
    indexed: ['email', 'username'],
    wal: true
  },

  // Resources: Important - File-per-record + 2s batching
  resources: {
    strategy: 'file-per-record',
    path: '/data/resources',
    indexed: ['projectId', 'status'],
    wal: false  // 2s loss acceptable
  },

  // Projects: Important - File-per-record
  projects: {
    strategy: 'file-per-record',
    path: '/data/projects',
    indexed: ['organisationId', 'slug'],
    wal: false
  },

  // Sessions: Temporary - Memory-only
  sessions: {
    strategy: 'memory-only',
    ttl: 3600
  },

  // Audit logs: Critical - JSONL + WAL
  auditLogs: {
    strategy: 'single-file',
    path: '/data/logs/audit.jsonl',
    wal: true
  }
});
```

**Result:**
- ✅ File-per-record for collections (as requested)
- ✅ JSONL indices (as requested)
- ✅ Atomic writes (crash-safe)
- ✅ Zero data loss for critical collections (WAL)
- ✅ 2s batching for non-critical collections (performance)
- ✅ Memory-only for temporary data (efficiency)

**Effort:** ~3-4 days to implement and test thoroughly

---

**Document Version:** 1.0
**Last Updated:** 2025-12-10
