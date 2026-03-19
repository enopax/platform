import { createStore } from 'tinybase';
import {
  TinyBaseUserStorageQuotaRepository,
  TinyBaseUserStorageMetricsRepository,
  TinyBaseUserStorageActivityRepository,
} from '@/lib/store/tinybase/user-storage.tinybase';

describe('TinyBaseUserStorageQuotaRepository', () => {
  let repo: TinyBaseUserStorageQuotaRepository;

  beforeEach(() => {
    repo = new TinyBaseUserStorageQuotaRepository(createStore());
  });

  it('creates a quota with defaults', async () => {
    const quota = await repo.create({ userId: 'user-1' });
    expect(quota.userId).toBe('user-1');
    expect(quota.tier).toBe('FREE_500MB');
    expect(quota.allocatedBytes).toBe(BigInt(524288000));
    expect(quota.usedBytes).toBe(BigInt(0));
    expect(quota.createdAt).toBeInstanceOf(Date);
  });

  it('creates a quota with custom tier', async () => {
    const quota = await repo.create({
      userId: 'user-1',
      tier: 'PRO_50GB',
      allocatedBytes: BigInt(53687091200),
    });
    expect(quota.tier).toBe('PRO_50GB');
    expect(quota.allocatedBytes).toBe(BigInt(53687091200));
  });

  it('finds quota by userId', async () => {
    await repo.create({ userId: 'user-1' });
    const found = await repo.findByUserId('user-1');
    expect(found).not.toBeNull();
    expect(found!.userId).toBe('user-1');
  });

  it('returns null for unknown user', async () => {
    expect(await repo.findByUserId('unknown')).toBeNull();
  });

  it('updates tier and allocatedBytes', async () => {
    await repo.create({ userId: 'user-1' });
    const updated = await repo.update('user-1', {
      tier: 'PRO_50GB',
      allocatedBytes: BigInt(53687091200),
    });
    expect(updated.tier).toBe('PRO_50GB');
    expect(updated.allocatedBytes).toBe(BigInt(53687091200));
  });

  it('updates usedBytes', async () => {
    await repo.create({ userId: 'user-1' });
    const updated = await repo.update('user-1', {
      usedBytes: BigInt(1000000),
    });
    expect(updated.usedBytes).toBe(BigInt(1000000));
  });

  it('throws when updating nonexistent user', async () => {
    await expect(repo.update('missing', { tier: 'PRO_50GB' })).rejects.toThrow();
  });
});

describe('TinyBaseUserStorageMetricsRepository', () => {
  let repo: TinyBaseUserStorageMetricsRepository;

  beforeEach(() => {
    repo = new TinyBaseUserStorageMetricsRepository(createStore());
  });

  it('creates metrics with defaults', async () => {
    const m = await repo.create({ userId: 'user-1' });
    expect(m.userId).toBe('user-1');
    expect(m.totalFiles).toBe(0);
    expect(m.totalSize).toBe(BigInt(0));
    expect(m.availabilityRate).toBe(100.0);
  });

  it('creates metrics with custom values', async () => {
    const m = await repo.create({
      userId: 'user-1',
      totalFiles: 50,
      totalSize: BigInt(5000000),
      uploadCount: 10,
    });
    expect(m.totalFiles).toBe(50);
    expect(m.totalSize).toBe(BigInt(5000000));
    expect(m.uploadCount).toBe(10);
  });

  it('finds by userId', async () => {
    await repo.create({ userId: 'user-1' });
    await repo.create({ userId: 'user-2' });
    const results = await repo.findByUserId('user-1');
    expect(results).toHaveLength(1);
  });

  it('filters by date range', async () => {
    await repo.create({ userId: 'user-1', date: new Date('2026-01-15') });
    await repo.create({ userId: 'user-1', date: new Date('2026-02-15') });
    await repo.create({ userId: 'user-1', date: new Date('2026-03-15') });

    const results = await repo.findByUserId('user-1', {
      from: new Date('2026-02-01'),
      to: new Date('2026-02-28'),
    });
    expect(results).toHaveLength(1);
  });

  it('finds by user and date', async () => {
    await repo.create({ userId: 'user-1', date: new Date('2026-03-15T10:00:00Z') });
    const found = await repo.findByUserAndDate('user-1', new Date('2026-03-15'));
    expect(found).not.toBeNull();
  });

  it('returns null for missing date', async () => {
    await repo.create({ userId: 'user-1', date: new Date('2026-03-15') });
    const found = await repo.findByUserAndDate('user-1', new Date('2026-03-16'));
    expect(found).toBeNull();
  });
});

describe('TinyBaseUserStorageActivityRepository', () => {
  let repo: TinyBaseUserStorageActivityRepository;

  beforeEach(() => {
    repo = new TinyBaseUserStorageActivityRepository(createStore());
  });

  it('creates an activity entry', async () => {
    const a = await repo.create({
      userId: 'user-1',
      action: 'upload',
      fileName: 'test.txt',
      fileSize: BigInt(1024),
    });
    expect(a.userId).toBe('user-1');
    expect(a.action).toBe('upload');
    expect(a.fileName).toBe('test.txt');
    expect(a.fileSize).toBe(BigInt(1024));
    expect(a.success).toBe(true);
    expect(a.timestamp).toBeInstanceOf(Date);
  });

  it('creates a failed activity', async () => {
    const a = await repo.create({
      userId: 'user-1',
      action: 'upload',
      success: false,
      errorMessage: 'Disk full',
    });
    expect(a.success).toBe(false);
    expect(a.errorMessage).toBe('Disk full');
  });

  it('finds by userId', async () => {
    await repo.create({ userId: 'user-1', action: 'upload' });
    await repo.create({ userId: 'user-1', action: 'download' });
    await repo.create({ userId: 'user-2', action: 'upload' });

    const results = await repo.findByUserId('user-1');
    expect(results).toHaveLength(2);
  });

  it('supports pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.create({ userId: 'user-1', action: `action-${i}` });
    }
    const page = await repo.findByUserId('user-1', { skip: 1, take: 2 });
    expect(page).toHaveLength(2);
  });

  it('filters by date range', async () => {
    await repo.create({ userId: 'user-1', action: 'upload' });
    const results = await repo.findByUserId('user-1', {
      from: new Date('2020-01-01'),
      to: new Date('2030-01-01'),
    });
    expect(results).toHaveLength(1);
  });
});
