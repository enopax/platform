import type { UserStorageQuota, UserStorageMetrics, UserStorageActivity, StorageTier } from '../types';

export interface CreateStorageQuotaData {
  userId: string;
  tier?: StorageTier;
  allocatedBytes?: bigint;
}

export interface IUserStorageQuotaRepository {
  create(data: CreateStorageQuotaData): Promise<UserStorageQuota>;
  findByUserId(userId: string): Promise<UserStorageQuota | null>;
  update(userId: string, data: Partial<Pick<UserStorageQuota, 'tier' | 'allocatedBytes' | 'usedBytes' | 'tierUpdatedAt' | 'tierUpdatedBy' | 'subscriptionId' | 'subscriptionEnds'>>): Promise<UserStorageQuota>;
}

export interface CreateStorageMetricsData {
  userId: string;
  date?: Date;
  totalFiles?: number;
  totalSize?: bigint;
  pinnedFiles?: number;
  pinnedSize?: bigint;
  uploadCount?: number;
  downloadCount?: number;
  deleteCount?: number;
  documentFiles?: number;
  imageFiles?: number;
  videoFiles?: number;
  archiveFiles?: number;
  otherFiles?: number;
  avgResponseTime?: number;
  availabilityRate?: number;
}

export interface IUserStorageMetricsRepository {
  create(data: CreateStorageMetricsData): Promise<UserStorageMetrics>;
  findByUserId(userId: string, options?: { from?: Date; to?: Date }): Promise<UserStorageMetrics[]>;
  findByUserAndDate(userId: string, date: Date): Promise<UserStorageMetrics | null>;
}

export interface CreateStorageActivityData {
  userId: string;
  action: string;
  fileName?: string;
  fileSize?: bigint;
  ipfsHash?: string;
  responseTime?: number;
  success?: boolean;
  errorMessage?: string;
}

export interface IUserStorageActivityRepository {
  create(data: CreateStorageActivityData): Promise<UserStorageActivity>;
  findByUserId(userId: string, options?: { from?: Date; to?: Date; skip?: number; take?: number }): Promise<UserStorageActivity[]>;
}
