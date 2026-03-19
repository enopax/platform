import type { Store } from 'tinybase';
import type { UserStorageQuota, UserStorageMetrics, UserStorageActivity, StorageTier } from '../types';
import type {
  IUserStorageQuotaRepository, CreateStorageQuotaData,
  IUserStorageMetricsRepository, CreateStorageMetricsData,
  IUserStorageActivityRepository, CreateStorageActivityData,
} from '../repositories/user-storage.repository';
import crypto from 'crypto';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

const QUOTA_TABLE = 'storage-quotas';
const METRICS_TABLE = 'storage-metrics';
const ACTIVITY_TABLE = 'storage-activity';

function rowToQuota(id: string, row: Record<string, any>): UserStorageQuota {
  return {
    id,
    userId: row.userId as string,
    tier: row.tier as StorageTier,
    allocatedBytes: BigInt(row.allocatedBytes as string),
    usedBytes: BigInt(row.usedBytes as string),
    lastUpdated: new Date(row.lastUpdated as string),
    tierUpdatedAt: row.tierUpdatedAt ? new Date(row.tierUpdatedAt as string) : null,
    tierUpdatedBy: (row.tierUpdatedBy as string) || null,
    subscriptionId: (row.subscriptionId as string) || null,
    subscriptionEnds: row.subscriptionEnds ? new Date(row.subscriptionEnds as string) : null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function rowToMetrics(id: string, row: Record<string, any>): UserStorageMetrics {
  return {
    id,
    userId: row.userId as string,
    date: new Date(row.date as string),
    totalFiles: row.totalFiles as number,
    totalSize: BigInt(row.totalSize as string),
    pinnedFiles: row.pinnedFiles as number,
    pinnedSize: BigInt(row.pinnedSize as string),
    uploadCount: row.uploadCount as number,
    downloadCount: row.downloadCount as number,
    deleteCount: row.deleteCount as number,
    documentFiles: row.documentFiles as number,
    imageFiles: row.imageFiles as number,
    videoFiles: row.videoFiles as number,
    archiveFiles: row.archiveFiles as number,
    otherFiles: row.otherFiles as number,
    avgResponseTime: row.avgResponseTime as number,
    availabilityRate: row.availabilityRate as number,
  };
}

function rowToActivity(id: string, row: Record<string, any>): UserStorageActivity {
  return {
    id,
    userId: row.userId as string,
    action: row.action as string,
    fileName: (row.fileName as string) || null,
    fileSize: row.fileSize ? BigInt(row.fileSize as string) : null,
    ipfsHash: (row.ipfsHash as string) || null,
    timestamp: new Date(row.timestamp as string),
    responseTime: row.responseTime ? (row.responseTime as number) : null,
    success: row.success === 1,
    errorMessage: (row.errorMessage as string) || null,
  };
}

export class TinyBaseUserStorageQuotaRepository implements IUserStorageQuotaRepository {
  constructor(private store: Store) {}

  async create(data: CreateStorageQuotaData): Promise<UserStorageQuota> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(QUOTA_TABLE, id, {
      userId: data.userId,
      tier: data.tier ?? 'FREE_500MB',
      allocatedBytes: (data.allocatedBytes ?? BigInt(524288000)).toString(),
      usedBytes: '0',
      lastUpdated: now,
      tierUpdatedAt: '',
      tierUpdatedBy: '',
      subscriptionId: '',
      subscriptionEnds: '',
      createdAt: now,
      updatedAt: now,
    });

    return rowToQuota(id, this.store.getRow(QUOTA_TABLE, id));
  }

  async findByUserId(userId: string): Promise<UserStorageQuota | null> {
    const rowIds = this.store.getRowIds(QUOTA_TABLE);
    for (const id of rowIds) {
      const row = this.store.getRow(QUOTA_TABLE, id);
      if (row.userId === userId) return rowToQuota(id, row);
    }
    return null;
  }

  async update(
    userId: string,
    data: Partial<Pick<UserStorageQuota, 'tier' | 'allocatedBytes' | 'usedBytes' | 'tierUpdatedAt' | 'tierUpdatedBy' | 'subscriptionId' | 'subscriptionEnds'>>
  ): Promise<UserStorageQuota> {
    const rowIds = this.store.getRowIds(QUOTA_TABLE);
    let targetId: string | null = null;
    for (const id of rowIds) {
      const row = this.store.getRow(QUOTA_TABLE, id);
      if (row.userId === userId) { targetId = id; break; }
    }
    if (!targetId) throw new Error(`StorageQuota for user ${userId} not found`);

    if (data.tier !== undefined) this.store.setCell(QUOTA_TABLE, targetId, 'tier', data.tier);
    if (data.allocatedBytes !== undefined) this.store.setCell(QUOTA_TABLE, targetId, 'allocatedBytes', data.allocatedBytes.toString());
    if (data.usedBytes !== undefined) this.store.setCell(QUOTA_TABLE, targetId, 'usedBytes', data.usedBytes.toString());
    if (data.tierUpdatedAt !== undefined) this.store.setCell(QUOTA_TABLE, targetId, 'tierUpdatedAt', data.tierUpdatedAt ? data.tierUpdatedAt.toISOString() : '');
    if (data.tierUpdatedBy !== undefined) this.store.setCell(QUOTA_TABLE, targetId, 'tierUpdatedBy', data.tierUpdatedBy ?? '');
    if (data.subscriptionId !== undefined) this.store.setCell(QUOTA_TABLE, targetId, 'subscriptionId', data.subscriptionId ?? '');
    if (data.subscriptionEnds !== undefined) this.store.setCell(QUOTA_TABLE, targetId, 'subscriptionEnds', data.subscriptionEnds ? data.subscriptionEnds.toISOString() : '');
    this.store.setCell(QUOTA_TABLE, targetId, 'lastUpdated', new Date().toISOString());
    this.store.setCell(QUOTA_TABLE, targetId, 'updatedAt', new Date().toISOString());

    return rowToQuota(targetId, this.store.getRow(QUOTA_TABLE, targetId));
  }
}

export class TinyBaseUserStorageMetricsRepository implements IUserStorageMetricsRepository {
  constructor(private store: Store) {}

  async create(data: CreateStorageMetricsData): Promise<UserStorageMetrics> {
    const id = generateId();
    const now = new Date();

    this.store.setRow(METRICS_TABLE, id, {
      userId: data.userId,
      date: (data.date ?? now).toISOString(),
      totalFiles: data.totalFiles ?? 0,
      totalSize: (data.totalSize ?? BigInt(0)).toString(),
      pinnedFiles: data.pinnedFiles ?? 0,
      pinnedSize: (data.pinnedSize ?? BigInt(0)).toString(),
      uploadCount: data.uploadCount ?? 0,
      downloadCount: data.downloadCount ?? 0,
      deleteCount: data.deleteCount ?? 0,
      documentFiles: data.documentFiles ?? 0,
      imageFiles: data.imageFiles ?? 0,
      videoFiles: data.videoFiles ?? 0,
      archiveFiles: data.archiveFiles ?? 0,
      otherFiles: data.otherFiles ?? 0,
      avgResponseTime: data.avgResponseTime ?? 0,
      availabilityRate: data.availabilityRate ?? 100.0,
    });

    return rowToMetrics(id, this.store.getRow(METRICS_TABLE, id));
  }

  async findByUserId(userId: string, options?: { from?: Date; to?: Date }): Promise<UserStorageMetrics[]> {
    const rowIds = this.store.getRowIds(METRICS_TABLE);
    const results: UserStorageMetrics[] = [];

    for (const id of rowIds) {
      const row = this.store.getRow(METRICS_TABLE, id);
      if (row.userId !== userId) continue;
      const date = new Date(row.date as string);
      if (options?.from && date < options.from) continue;
      if (options?.to && date > options.to) continue;
      results.push(rowToMetrics(id, row));
    }

    results.sort((a, b) => b.date.getTime() - a.date.getTime());
    return results;
  }

  async findByUserAndDate(userId: string, date: Date): Promise<UserStorageMetrics | null> {
    const dateStr = date.toISOString().split('T')[0];
    const rowIds = this.store.getRowIds(METRICS_TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(METRICS_TABLE, id);
      if (row.userId !== userId) continue;
      const rowDate = (row.date as string).split('T')[0];
      if (rowDate === dateStr) return rowToMetrics(id, row);
    }
    return null;
  }
}

export class TinyBaseUserStorageActivityRepository implements IUserStorageActivityRepository {
  constructor(private store: Store) {}

  async create(data: CreateStorageActivityData): Promise<UserStorageActivity> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(ACTIVITY_TABLE, id, {
      userId: data.userId,
      action: data.action,
      fileName: data.fileName ?? '',
      fileSize: data.fileSize ? data.fileSize.toString() : '',
      ipfsHash: data.ipfsHash ?? '',
      timestamp: now,
      responseTime: data.responseTime ?? 0,
      success: (data.success ?? true) ? 1 : 0,
      errorMessage: data.errorMessage ?? '',
    });

    return rowToActivity(id, this.store.getRow(ACTIVITY_TABLE, id));
  }

  async findByUserId(
    userId: string,
    options?: { from?: Date; to?: Date; skip?: number; take?: number }
  ): Promise<UserStorageActivity[]> {
    const rowIds = this.store.getRowIds(ACTIVITY_TABLE);
    let results: UserStorageActivity[] = [];

    for (const id of rowIds) {
      const row = this.store.getRow(ACTIVITY_TABLE, id);
      if (row.userId !== userId) continue;
      const ts = new Date(row.timestamp as string);
      if (options?.from && ts < options.from) continue;
      if (options?.to && ts > options.to) continue;
      results.push(rowToActivity(id, row));
    }

    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (options?.skip) results = results.slice(options.skip);
    if (options?.take) results = results.slice(0, options.take);
    return results;
  }
}
