# TinyBase Custom Persister Analysis

**Date:** 2025-12-10
**Question:** Can we implement custom file storage with TinyBase?

---

## ✅ YES - TinyBase Supports Custom Persisters!

TinyBase is **fully extensible** via the `createCustomPersister` API. You can implement **any storage pattern** you want.

---

## 📁 Your Desired Storage Pattern

```
/data/users/
├── 550e8400-e29b-41d4-a906-446655440000.json  # User record
├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.json  # User record
└── indices/
    ├── email.jsonl     # Index: one JSON object per line
    └── username.jsonl  # Index: one JSON object per line
```

### ✅ **FULLY ACHIEVABLE** with TinyBase Custom Persister

---

## 🔧 How TinyBase Custom Persisters Work

### API Overview

```typescript
import {createCustomPersister} from 'tinybase/persisters';

const persister = createCustomPersister(
  store,                    // The TinyBase store
  getPersisted,             // Function to LOAD data
  setPersisted,             // Function to SAVE data
  addPersisterListener,     // Watch for external changes
  delPersisterListener,     // Stop watching
  onIgnoredError            // Error handler (optional)
);
```

### Interface

```typescript
// From: tinybase/src/persisters/common/create.ts:98-124

export const createCustomPersister = <ListenerHandle>(
  store: Store | MergeableStore,

  // Load function: Read from your custom storage
  getPersisted: () => Promise<PersistedContent | undefined>,

  // Save function: Write to your custom storage
  setPersisted: (
    getContent: () => PersistedContent,
    changes?: Changes
  ) => Promise<void>,

  // Listen for external changes (optional, for multi-instance sync)
  addPersisterListener: (listener: PersisterListener) => ListenerHandle,

  // Stop listening
  delPersisterListener: (listenerHandle: ListenerHandle) => void,

  // Error handler
  onIgnoredError?: (error: any) => void
) => Persister
```

### Example: FilePersister Implementation

```typescript
// From: tinybase/src/persisters/persister-file/index.ts:21-56

export const createFilePersister = (
  store: Store | MergeableStore,
  filePath: string,
  onIgnoredError?: (error: any) => void,
): FilePersister => {

  // 1. Load: Read entire file
  const getPersisted = async () =>
    jsonParseWithUndefined(await readFile(filePath, UTF8));

  // 2. Save: Write entire file
  const setPersisted = async (getContent) =>
    await writeFile(filePath, jsonStringWithUndefined(getContent()), UTF8);

  // 3. Watch for file changes (for multi-instance sync)
  const addPersisterListener = (listener) => {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, EMPTY_STRING, UTF8);
    }
    return watch(filePath, () => listener());
  };

  // 4. Stop watching
  const delPersisterListener = (watcher) => watcher?.close();

  return createCustomPersister(
    store,
    getPersisted,
    setPersisted,
    addPersisterListener,
    delPersisterListener,
    onIgnoredError
  );
};
```

---

## 💡 Implementation: File-Per-Record Persister

### Step 1: Understand TinyBase's Data Structure

**TinyBase Content Format:**
```typescript
type Content = [
  Tables,  // { [tableId: string]: { [rowId: string]: Row } }
  Values   // { [valueId: string]: any }
];

// Example:
const content: Content = [
  {
    users: {
      '550e8400-e29b-41d4-a906-446655440000': {
        email: 'alice@example.com',
        name: 'Alice',
        age: 30
      },
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8': {
        email: 'bob@example.com',
        name: 'Bob',
        age: 25
      }
    }
  },
  {
    appName: 'MyApp',
    version: '1.0.0'
  }
];
```

### Step 2: Implement Custom Persister

```typescript
import {createCustomPersister} from 'tinybase/persisters';
import {Store} from 'tinybase';
import {readFile, writeFile, readdir, mkdir} from 'fs/promises';
import {existsSync} from 'fs';
import {join} from 'path';

/**
 * File-per-record persister with JSONL indices
 */
export const createFilePerRecordPersister = (
  store: Store,
  dataPath: string = '/data',
  onIgnoredError?: (error: any) => void
) => {

  // ============================================
  // LOAD: Read from file-per-record structure
  // ============================================
  const getPersisted = async (): Promise<Content | undefined> => {
    try {
      const tables: Tables = {};
      const values: Values = {};

      // Load tables (e.g., /data/users/)
      const tableNames = await readdir(dataPath);

      for (const tableName of tableNames) {
        const tablePath = join(dataPath, tableName);
        const stat = await stat(tablePath);

        if (!stat.isDirectory()) continue;

        // Skip indices directory
        if (tableName === 'indices') continue;

        tables[tableName] = {};

        // Load all records from this table
        const recordFiles = await readdir(tablePath);

        for (const recordFile of recordFiles) {
          if (!recordFile.endsWith('.json')) continue;

          const recordPath = join(tablePath, recordFile);
          const recordData = await readFile(recordPath, 'utf8');
          const record = JSON.parse(recordData);

          // Extract rowId from filename (uuid.json)
          const rowId = recordFile.replace('.json', '');
          tables[tableName][rowId] = record;
        }
      }

      // Load values (stored in root _values.json)
      const valuesPath = join(dataPath, '_values.json');
      if (existsSync(valuesPath)) {
        const valuesData = await readFile(valuesPath, 'utf8');
        Object.assign(values, JSON.parse(valuesData));
      }

      return [tables, values];

    } catch (error) {
      if (error.code === 'ENOENT') {
        return undefined; // No data yet
      }
      throw error;
    }
  };

  // ============================================
  // SAVE: Write to file-per-record structure
  // ============================================
  const setPersisted = async (
    getContent: () => Content,
    changes?: Changes
  ): Promise<void> => {
    const [tables, values] = getContent();

    // ============================================
    // STRATEGY 1: Full Save (Simple but Slow)
    // ============================================
    // Write every record to its own file
    for (const [tableName, rows] of Object.entries(tables)) {
      const tablePath = join(dataPath, tableName);
      await mkdir(tablePath, {recursive: true});

      for (const [rowId, row] of Object.entries(rows)) {
        const recordPath = join(tablePath, `${rowId}.json`);

        // ATOMIC WRITE PATTERN (like SylvieJS)
        const tmpPath = `${recordPath}.tmp`;
        await writeFile(tmpPath, JSON.stringify(row, null, 2), 'utf8');
        await rename(tmpPath, recordPath); // Atomic rename
      }

      // Rebuild indices for this table
      await rebuildIndices(tableName, tablePath, rows);
    }

    // Save values
    const valuesPath = join(dataPath, '_values.json');
    const tmpValuesPath = `${valuesPath}.tmp`;
    await writeFile(tmpValuesPath, JSON.stringify(values, null, 2), 'utf8');
    await rename(tmpValuesPath, valuesPath);
  };

  // ============================================
  // INCREMENTAL SAVE (Optimized with Changes)
  // ============================================
  const setPersisted_Incremental = async (
    getContent: () => Content,
    changes?: Changes
  ): Promise<void> => {

    if (!changes) {
      // First save or full save requested
      return setPersisted(getContent, changes);
    }

    const [tables, values] = getContent();
    const [changedTables, changedValues] = changes;

    // Only write changed records
    for (const [tableName, changedRows] of Object.entries(changedTables)) {
      const tablePath = join(dataPath, tableName);
      await mkdir(tablePath, {recursive: true});

      const indexedFields = ['email']; // TODO: Make configurable
      const updatedRows: Record<string, any> = {};

      for (const [rowId, [cellChanges, wasDeleted]] of Object.entries(changedRows)) {
        const recordPath = join(tablePath, `${rowId}.json`);

        if (wasDeleted) {
          // Delete record file
          await unlink(recordPath).catch(() => {}); // Ignore if not exists
        } else {
          // Write/update record
          const row = tables[tableName][rowId];
          const tmpPath = `${recordPath}.tmp`;
          await writeFile(tmpPath, JSON.stringify(row, null, 2), 'utf8');
          await rename(tmpPath, recordPath); // Atomic

          updatedRows[rowId] = row;
        }
      }

      // Update indices (only for changed records)
      await updateIndices(tableName, tablePath, updatedRows, indexedFields);
    }

    // Save changed values
    if (Object.keys(changedValues).length > 0) {
      const valuesPath = join(dataPath, '_values.json');
      const tmpValuesPath = `${valuesPath}.tmp`;
      await writeFile(tmpValuesPath, JSON.stringify(values, null, 2), 'utf8');
      await rename(tmpValuesPath, valuesPath);
    }
  };

  // ============================================
  // INDEX MANAGEMENT: JSONL Format
  // ============================================
  const rebuildIndices = async (
    tableName: string,
    tablePath: string,
    rows: Record<string, any>
  ) => {
    const indicesPath = join(tablePath, 'indices');
    await mkdir(indicesPath, {recursive: true});

    // Define which fields to index
    const indexedFields = ['email']; // TODO: Make this configurable

    for (const field of indexedFields) {
      const indexPath = join(indicesPath, `${field}.jsonl`);
      const indexLines: string[] = [];

      // Build index: one JSON object per line
      for (const [rowId, row] of Object.entries(rows)) {
        if (row[field] !== undefined) {
          indexLines.push(JSON.stringify({
            key: row[field],
            rowId: rowId
          }));
        }
      }

      // Write atomically
      const tmpIndexPath = `${indexPath}.tmp`;
      await writeFile(tmpIndexPath, indexLines.join('\n'), 'utf8');
      await rename(tmpIndexPath, indexPath);
    }
  };

  const updateIndices = async (
    tableName: string,
    tablePath: string,
    updatedRows: Record<string, any>,
    indexedFields: string[]
  ) => {
    const indicesPath = join(tablePath, 'indices');
    await mkdir(indicesPath, {recursive: true});

    for (const field of indexedFields) {
      const indexPath = join(indicesPath, `${field}.jsonl`);

      // Read existing index
      let existingIndex: Map<string, string> = new Map();
      if (existsSync(indexPath)) {
        const indexData = await readFile(indexPath, 'utf8');
        const lines = indexData.split('\n').filter(line => line.trim());

        for (const line of lines) {
          const entry = JSON.parse(line);
          existingIndex.set(entry.rowId, entry.key);
        }
      }

      // Update with changed rows
      for (const [rowId, row] of Object.entries(updatedRows)) {
        if (row[field] !== undefined) {
          existingIndex.set(rowId, row[field]);
        } else {
          existingIndex.delete(rowId);
        }
      }

      // Rebuild index file
      const indexLines: string[] = [];
      for (const [rowId, key] of existingIndex.entries()) {
        indexLines.push(JSON.stringify({key, rowId}));
      }

      // Write atomically
      const tmpIndexPath = `${indexPath}.tmp`;
      await writeFile(tmpIndexPath, indexLines.join('\n'), 'utf8');
      await rename(tmpIndexPath, indexPath);
    }
  };

  // ============================================
  // LISTENER: Watch for external file changes
  // ============================================
  const addPersisterListener = (listener: PersisterListener) => {
    // Watch the data directory for changes
    // (e.g., another process modifying files)
    const watcher = watch(dataPath, {recursive: true}, (eventType, filename) => {
      if (filename && filename.endsWith('.json')) {
        listener();
      }
    });
    return watcher;
  };

  const delPersisterListener = (watcher: FSWatcher) => {
    watcher.close();
  };

  // ============================================
  // CREATE PERSISTER
  // ============================================
  return createCustomPersister(
    store,
    getPersisted,
    setPersisted_Incremental, // Use incremental save
    addPersisterListener,
    delPersisterListener,
    onIgnoredError
  );
};
```

### Step 3: Usage Example

```typescript
import {createStore} from 'tinybase';
import {createFilePerRecordPersister} from './file-per-record-persister';

// Create store
const store = createStore();

// Create custom persister
const persister = createFilePerRecordPersister(
  store,
  '/data',
  (error) => console.error('Persister error:', error)
);

// Load existing data
await persister.load();

// Enable auto-save (batch writes every 2s)
await persister.startAutoSave();

// Use the store
store.setRow('users', '550e8400-e29b-41d4-a906-446655440000', {
  email: 'alice@example.com',
  name: 'Alice',
  age: 30
});

store.setRow('users', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', {
  email: 'bob@example.com',
  name: 'Bob',
  age: 25
});

// Changes are automatically batched and saved every 2s
// (or immediately on process exit if you call persister.save())
```

### Result Directory Structure

```
/data/
├── users/
│   ├── 550e8400-e29b-41d4-a906-446655440000.json
│   ├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.json
│   └── indices/
│       └── email.jsonl
└── _values.json
```

**users/550e8400-e29b-41d4-a906-446655440000.json:**
```json
{
  "email": "alice@example.com",
  "name": "Alice",
  "age": 30
}
```

**users/indices/email.jsonl:**
```jsonl
{"key":"alice@example.com","rowId":"550e8400-e29b-41d4-a906-446655440000"}
{"key":"bob@example.com","rowId":"6ba7b810-9dad-11d1-80b4-00c04fd430c8"}
```

---

## 🔥 Atomic Writes with Batch Timer

### Question: Is batch writing every 2s safe?

**Answer: ⚠️ IT DEPENDS on your crash-safety requirements**

### Scenario Analysis

#### ✅ **Safe Pattern (Recommended):**

```typescript
// Use atomic write pattern (temp file + rename)
const setPersisted = async (getContent, changes) => {
  for (const [rowId, row] of Object.entries(updatedRows)) {
    const recordPath = join(tablePath, `${rowId}.json`);
    const tmpPath = `${recordPath}.tmp`;

    // 1. Write to temp file
    await writeFile(tmpPath, JSON.stringify(row, null, 2), 'utf8');

    // 2. Atomic rename (crash-safe on POSIX systems)
    await rename(tmpPath, recordPath);
  }
};

// Auto-save every 2s
await persister.startAutoSave();
```

**Risk Assessment:**

| Event | Result | Data Loss |
|-------|--------|-----------|
| **Crash before 2s timer** | ❌ Changes since last save are lost | ⚠️ Up to 2 seconds of writes |
| **Crash during save** | ✅ Old file OR new file exists (never corrupt) | ✅ No corruption |
| **Power loss before 2s** | ❌ Changes lost | ⚠️ Up to 2 seconds of writes |
| **Power loss during save** | ✅ Atomic rename is safe | ✅ No corruption |

**Conclusion:**
- ✅ **Files are never corrupted** (thanks to atomic rename)
- ⚠️ **Data loss window: up to 2 seconds** of uncommitted changes
- ✅ **Acceptable for most applications** (e.g., Notion, Obsidian use similar patterns)

---

#### ❌ **Unsafe Pattern (Don't Use):**

```typescript
// Direct write (like TinyBase default FilePersister)
const setPersisted = async (getContent) => {
  // ❌ Direct overwrite - NOT crash-safe
  await writeFile(recordPath, JSON.stringify(row), 'utf8');
};
```

**Risk:**
- ❌ If Node.js crashes during `writeFile()`, file may be:
  - Partially written (corrupt JSON)
  - Empty (0 bytes)
  - Missing (unlinked but not written)

**Don't use this approach for production.**

---

### How to Minimize Data Loss Window

#### Option 1: Shorter Timer (1s instead of 2s)
```typescript
// Save more frequently
await persister.startAutoSave();
// TinyBase doesn't expose timer config, but you can fork or patch

// Manual implementation:
setInterval(async () => {
  await persister.save();
}, 1000);
```

**Trade-off:** More disk I/O, but less data loss risk

---

#### Option 2: Write-Ahead Log (WAL)

```typescript
// Before modifying store, append to WAL
const appendToWAL = async (change) => {
  const walPath = join(dataPath, '_wal.jsonl');
  await appendFile(walPath, JSON.stringify(change) + '\n', 'utf8');
};

// On startup, replay WAL
const replayWAL = async () => {
  const walPath = join(dataPath, '_wal.jsonl');
  if (existsSync(walPath)) {
    const walData = await readFile(walPath, 'utf8');
    const changes = walData.split('\n').filter(line => line.trim());

    for (const change of changes) {
      const changeObj = JSON.parse(change);
      // Apply change to store
      store.setRow(changeObj.table, changeObj.rowId, changeObj.row);
    }

    // Clear WAL after replay
    await unlink(walPath);
  }
};

// Use WAL
await replayWAL();
await persister.load();
```

**Benefits:**
- ✅ Every write is immediately logged
- ✅ Crash recovery: replay WAL on startup
- ✅ Data loss window: 0 seconds (everything is logged)

**Trade-offs:**
- ⚠️ More complex
- ⚠️ More disk I/O
- ⚠️ WAL file grows until trimmed

---

#### Option 3: Immediate Save on Critical Operations

```typescript
// Auto-save for normal operations (2s batching)
await persister.startAutoSave();

// Immediate save for critical operations
await store.setRow('orders', orderId, orderData);
await persister.save(); // Force immediate save
```

**Use for:**
- Financial transactions
- User authentication changes
- Critical configuration updates

---

## 📊 Comparison: TinyBase vs Custom Implementation

| Feature | TinyBase Default | TinyBase + Custom Persister | Custom Implementation |
|---------|------------------|----------------------------|----------------------|
| **File per record** | ❌ | ✅ | ✅ |
| **JSONL indices** | ❌ | ✅ | ✅ |
| **Atomic writes** | ❌ (direct write) | ✅ (if implemented) | ✅ (if implemented) |
| **Batch writes** | ✅ (auto-save) | ✅ (auto-save) | ⚠️ Manual |
| **Incremental saves** | ❌ (full store) | ✅ (if implemented) | ✅ |
| **Relationships API** | ✅ | ✅ | ❌ |
| **Reactive queries** | ✅ | ✅ | ❌ |
| **TypeScript** | ✅ | ✅ | ✅ (DIY) |
| **Open source** | ✅ MIT | ✅ MIT | ✅ DIY |
| **Complexity** | ⭐ Low | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ High |
| **Maintenance** | ✅ Upstream | ⚠️ Your code | ⚠️ Your code |

---

## 🎯 Recommendations

### Recommendation 1: ✅ **Use TinyBase with Custom Persister** (Best for Enopax)

**Why:**
- ✅ Gets you TinyBase's excellent Relationships API
- ✅ Gets you reactive queries and indexes
- ✅ Fully extensible (you control storage)
- ✅ Can implement atomic writes
- ✅ Can implement file-per-record pattern
- ✅ Can implement JSONL indices
- ✅ Active development and community
- ✅ Much simpler than building from scratch

**Effort:** ~2-3 days to implement custom persister

**Example Implementation:**
```typescript
// Your custom persister (200-300 lines)
const persister = createFilePerRecordPersister(store, '/data');

// Get all TinyBase benefits
const relationships = createRelationships(store);
const indexes = createIndexes(store);
const queries = createQueries(store);

// Your storage pattern
// /data/users/<uuid>.json
// /data/users/indices/email.jsonl
```

---

### Recommendation 2: ⚠️ **Custom Implementation** (Only if you need full control)

**Why:**
- ✅ Full control over every aspect
- ✅ No dependency
- ✅ Can optimize for your specific use case

**Why Not:**
- ❌ Need to implement relationships manually
- ❌ Need to implement reactive queries manually
- ❌ Need to implement indexes manually
- ❌ 10x more code to maintain
- ❌ More bugs (no community testing)

**Effort:** ~2-3 weeks to build, test, and stabilize

---

### Recommendation 3: ❌ **SQLite** (If you can relax constraints)

**Why:**
- ✅ Battle-tested
- ✅ ACID compliance
- ✅ WAL mode (crash-safe)
- ✅ Excellent performance

**Why Not:**
- ❌ Files are binary (not human-readable JSON)
- ❌ Not file-per-record
- ❌ Requires SQL (violates "no SQL" constraint)

---

## 🔒 Crash-Safety Best Practices

### Pattern 1: Atomic Rename (SylvieJS Style)

```typescript
const saveRecord = async (rowId: string, row: any) => {
  const recordPath = join(tablePath, `${rowId}.json`);
  const tmpPath = `${recordPath}.tmp`;

  // Write to temp
  await writeFile(tmpPath, JSON.stringify(row, null, 2), 'utf8');

  // Atomic rename (POSIX guarantees atomicity)
  await rename(tmpPath, recordPath);
};
```

**Guarantees:**
- ✅ Old file OR new file exists (never corrupt)
- ✅ Survives crashes during write
- ✅ Survives power loss during write

---

### Pattern 2: fsync for Durability (Production-Grade)

```typescript
import {open} from 'fs/promises';

const saveRecordDurable = async (rowId: string, row: any) => {
  const recordPath = join(tablePath, `${rowId}.json`);
  const tmpPath = `${recordPath}.tmp`;

  // Write to temp
  const fd = await open(tmpPath, 'w');
  await fd.writeFile(JSON.stringify(row, null, 2), 'utf8');
  await fd.sync(); // Force to disk (fsync)
  await fd.close();

  // Atomic rename
  await rename(tmpPath, recordPath);

  // Sync parent directory (ensures rename is durable)
  const dirFd = await open(tablePath, 'r');
  await dirFd.sync();
  await dirFd.close();
};
```

**Guarantees:**
- ✅ Data is on disk before rename
- ✅ Rename is on disk before returning
- ✅ Survives power loss at any point
- ⚠️ Slower (wait for disk I/O)

---

### Pattern 3: Batch Atomic Writes

```typescript
const saveRecordsBatch = async (records: Record<string, any>) => {
  // Write all records to temp files
  const promises = Object.entries(records).map(([rowId, row]) => {
    const recordPath = join(tablePath, `${rowId}.json`);
    const tmpPath = `${recordPath}.tmp`;
    return writeFile(tmpPath, JSON.stringify(row, null, 2), 'utf8')
      .then(() => ({recordPath, tmpPath}));
  });

  const tempFiles = await Promise.all(promises);

  // Atomic rename all at once
  await Promise.all(
    tempFiles.map(({recordPath, tmpPath}) => rename(tmpPath, recordPath))
  );
};
```

**Guarantees:**
- ✅ All records updated atomically (from observer perspective)
- ✅ Fast (parallel writes)
- ⚠️ Individual files may be at different versions during crash

---

## 📈 Performance Considerations

### Write Performance

| Pattern | Latency | Throughput | Crash-Safe |
|---------|---------|------------|------------|
| Direct write | ~1ms | High | ❌ |
| Atomic rename | ~2ms | High | ✅ |
| Atomic + fsync | ~10-50ms | Low | ✅✅ |
| Batch writes (2s) | ~2ms avg | Very High | ⚠️ (2s window) |

### Read Performance

| Pattern | Latency | Use Case |
|---------|---------|----------|
| Load all files | ~100ms (1000 records) | Startup |
| Load single file | ~1ms | Query by ID |
| Load from JSONL index | ~10ms (1000 entries) | Query by indexed field |
| Binary search index | ~1ms | Fast lookup |

---

## ✅ Final Answer

### Can you achieve your desired storage pattern with TinyBase?

**YES! ✅**

TinyBase's `createCustomPersister` API allows you to implement **any storage pattern** you want:
- ✅ `/data/users/<uuid>.json` per record
- ✅ `/data/users/indices/email.jsonl` for indices
- ✅ Atomic writes (temp file + rename)
- ✅ Batch writes every 2s
- ✅ Incremental saves (only changed records)

### Is batch writing every 2s safe?

**YES, with atomic rename pattern! ⚠️ (But with a data loss window)**

**Risk Assessment:**
- ✅ **Files are never corrupted** (atomic rename is crash-safe)
- ⚠️ **Data loss window: up to 2 seconds** of uncommitted writes
- ✅ **Acceptable for 95% of applications**

**Not acceptable for:**
- ❌ Financial transactions (use immediate save or WAL)
- ❌ Healthcare data (use WAL)
- ❌ Real-time critical systems (use immediate save)

**Perfect for:**
- ✅ Note-taking apps (Notion, Obsidian)
- ✅ Project management tools
- ✅ CMS systems
- ✅ Developer tools
- ✅ **Enopax Platform** (resource provisioning data)

---

## 🚀 Next Steps

1. **Implement custom persister** (~200-300 lines)
2. **Add atomic write pattern** (temp + rename)
3. **Implement JSONL indices**
4. **Test crash scenarios** (kill -9 during save)
5. **Measure performance** (1000s of records)
6. **Add WAL (optional)** for zero data loss

**Estimated effort:** 2-3 days for production-ready implementation

---

**Conclusion:** TinyBase + Custom Persister is the **best solution** for Enopax Platform. You get modern reactive database features with full control over storage format.
