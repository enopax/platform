# File-Store Documentation

**Date:** 2025-12-10
**Project:** Enopax Platform - File-based Datastore Analysis

---

## 📚 Overview

This directory contains comprehensive analysis and recommendations for implementing a file-based datastore for the Enopax Platform.

**Requirements:**
- TypeScript/JavaScript, Node.js
- File-based persistence (no separate DB process)
- Batch writes every ~2s from memory
- Atomic writes (crash-safe)
- JS objects storage
- Entities with relationships (1:N, M:N)
- Indexing for efficient lookups
- Storage flexibility (single file, file-per-collection, file-per-record)

---

## 📄 Documents

### 1. [TINYBASE_CUSTOM_PERSISTER_ANALYSIS.md](./TINYBASE_CUSTOM_PERSISTER_ANALYSIS.md)

**✅ How to implement custom storage patterns with TinyBase:**

**Key Findings:**
- ✅ TinyBase is fully extensible via `createCustomPersister` API
- ✅ Can implement file-per-record storage: `/data/users/<uuid>.json`
- ✅ Can implement JSONL indices: `/data/users/indices/email.jsonl`
- ✅ Open source (MIT License)
- ⚠️ Atomic writes with 2s batching: Safe but has data loss window

**Atomic Write Analysis:**
- ✅ Files never corrupted (atomic rename pattern)
- ⚠️ Data loss window: up to 2 seconds
- ✅ Acceptable for 95% of applications

**Complete Implementation:**
- ~200-300 lines of custom persister code
- Atomic write pattern (temp file + rename)
- Incremental saves (only changed records)
- JSONL index management

**Verdict:** ⭐ **RECOMMENDED** - Best solution for Enopax Platform

---

### 2. [PER_COLLECTION_STORAGE_AND_WAL.md](./PER_COLLECTION_STORAGE_AND_WAL.md)

**Advanced topics: Per-collection storage strategies & Write-Ahead Log (WAL):**

**Part 1: Per-Collection Storage**
- ✅ YES - You can store each collection differently
- Examples: file-per-record, single-file, memory-only, compressed
- Full implementation with ~300-400 lines of code

**Part 2: Write-Ahead Log (WAL) Explained**
- What: Log changes BEFORE writing to files
- Why: Zero data loss, crash recovery
- How: Append to WAL → Batch write → Clear WAL
- Cost: +50% write latency (~3-5ms vs ~2ms)

**Recommended Hybrid Approach:**
```typescript
{
  users: {
    strategy: 'file-per-record',
    wal: true,  // Critical: zero data loss
    indexed: ['email']
  },
  orders: {
    strategy: 'file-per-record',
    wal: false,  // 2s loss acceptable
    indexed: ['userId']
  },
  sessions: {
    strategy: 'memory-only'  // Temporary
  },
  auditLogs: {
    strategy: 'single-file',
    wal: true  // Critical: never lose logs
  }
}
```

---

## 🎯 Final Recommendation

### ⭐ **Use TinyBase with Custom Persister**

**Why:**
1. ✅ **Meets all requirements** - File-based, atomic writes, flexible storage
2. ✅ **Open source** - MIT license, fully extensible
3. ✅ **Modern features** - Relationships API, reactive queries, TypeScript
4. ✅ **Active development** - v7.0 released 2025, good community
5. ✅ **Your storage pattern** - File-per-record + JSONL indices achievable
6. ✅ **Crash-safe** - Atomic rename pattern prevents corruption
7. ✅ **Simple** - ~200-300 lines of custom code

**Implementation Effort:** 2-3 days

**Storage Pattern:**
```
/data/
├── users/
│   ├── 550e8400-e29b-41d4-a906-446655440000.json
│   ├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.json
│   └── indices/
│       └── email.jsonl
├── orders/
│   ├── order-001.json
│   └── indices/
│       └── userId.jsonl
└── _values.json
```

---

## 📊 Quick Comparison

| Feature | TinyBase + Custom | SylvieJS | SQLite |
|---------|-------------------|----------|--------|
| **File-per-record** | ✅ Custom | ⚠️ Via adapters | ❌ |
| **Atomic writes** | ✅ DIY | ✅ Built-in | ✅ WAL |
| **Relationships** | ✅ API | ❌ Manual | ✅ FK |
| **Open source** | ✅ MIT | ✅ MIT | ✅ Public |
| **Production ready** | ✅ Yes | ❌ No (0.0.19) | ✅ Yes |
| **Data loss (2s batch)** | ⚠️ 2s window | ⚠️ 2s window | ✅ WAL (0s) |
| **Complexity** | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| **Your storage format** | ✅ Yes | ⚠️ Partial | ❌ Binary |

---

## 🔧 Implementation Checklist

### Phase 1: Basic Implementation (2-3 days)
- [ ] Install TinyBase: `npm install tinybase`
- [ ] Implement custom persister (~200 lines)
  - [ ] `getPersisted()` - Load from file-per-record
  - [ ] `setPersisted()` - Save with atomic rename
  - [ ] `addPersisterListener()` - File watcher (optional)
- [ ] Test basic CRUD operations
- [ ] Test atomic write pattern (kill -9 during save)

### Phase 2: Advanced Features (1-2 days)
- [ ] Implement JSONL indices
- [ ] Implement per-collection storage strategies
- [ ] Add incremental saves (only changed records)
- [ ] Performance testing (1000s of records)

### Phase 3: Production Hardening (2-3 days)
- [ ] Add WAL for critical collections
- [ ] Add error handling and recovery
- [ ] Add monitoring and metrics
- [ ] Load testing and benchmarks
- [ ] Documentation

**Total Effort:** 5-8 days for production-ready implementation

---

## 📖 Additional Resources

### TinyBase
- Website: https://tinybase.org/
- GitHub: https://github.com/tinyplex/tinybase
- Docs: https://tinybase.org/api/
- Persisters: https://tinybase.org/api/persisters/

### Example Persisters (Study These)
- File Persister: `tinybase/src/persisters/persister-file/index.ts`
- SQLite Persister: `tinybase/src/persisters/persister-sqlite3/index.ts`
- Custom Persister API: `tinybase/src/persisters/common/create.ts`

### Atomic Writes
- POSIX rename atomicity: `man 2 rename`
- fsync durability: `man 2 fsync`

### WAL Pattern
- PostgreSQL WAL: https://www.postgresql.org/docs/current/wal-intro.html
- SQLite WAL: https://www.sqlite.org/wal.html

---

## 💬 Questions?

For implementation questions or clarifications:
1. Review the detailed documents in this directory
2. Check TinyBase documentation
3. Study the example persister implementations in TinyBase source

---

## 📝 Document Index

| Document | Purpose | Size | Key Insight |
|----------|---------|------|-------------|
| [DATASTORE_ANALYSIS.md](./DATASTORE_ANALYSIS.md) | Compare 3 options | 22.9 KB | SylvieJS best meets requirements |
| [SYLVIEJS_PRODUCTION_READINESS.md](./SYLVIEJS_PRODUCTION_READINESS.md) | SylvieJS assessment | 27.5 KB | ❌ Not production-ready (4/10) |
| [TINYBASE_CUSTOM_PERSISTER_ANALYSIS.md](./TINYBASE_CUSTOM_PERSISTER_ANALYSIS.md) | TinyBase implementation | 24.8 KB | ✅ Fully extensible, recommended |
| [PER_COLLECTION_STORAGE_AND_WAL.md](./PER_COLLECTION_STORAGE_AND_WAL.md) | Advanced patterns | 25.9 KB | Per-collection storage + WAL |

**Total:** 101 KB of analysis and implementation guidance

---

**Last Updated:** 2025-12-10
**Status:** ✅ Analysis Complete - Ready for Implementation
