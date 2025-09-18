import { PrismaClient, StorageTier, User } from '@prisma/client';

const prisma = new PrismaClient();

export class StorageQuotaService {

  // Storage tier limits in bytes
  private readonly storageQuotaLimits: Record<StorageTier, bigint> = {
    FREE_500MB: BigInt(500 * 1024 * 1024),
    BASIC_5GB: BigInt(5 * 1024 * 1024 * 1024),
    PRO_50GB: BigInt(10 * 1024 * 1024 * 1024), // Temporarily set to 10GB for testing
    ENTERPRISE_500GB: BigInt(500 * 1024 * 1024 * 1024),
    UNLIMITED: BigInt(Number.MAX_SAFE_INTEGER),
  };

  async getUserStorageQuota(userId: string): Promise<{
    quota: {
      id: string;
      tier: StorageTier;
      allocatedBytes: string;
      usedBytes: string;
      availableBytes: string;
      usagePercentage: number;
    };
    user: {
      storageTier: StorageTier;
    };
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          storageQuota: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create storage quota record if it doesn't exist
      let storageQuota = user.storageQuota;
      if (!storageQuota) {
        const allocatedBytes = this.storageQuotaLimits[user.storageTier];
        storageQuota = await prisma.userStorageQuota.create({
          data: {
            userId,
            tier: user.storageTier,
            allocatedBytes,
            usedBytes: BigInt(0),
          },
        });
      }

      // Ensure we have valid allocated bytes
      if (!storageQuota.allocatedBytes || storageQuota.allocatedBytes === BigInt(0)) {
        const allocatedBytes = this.storageQuotaLimits[storageQuota.tier];
        storageQuota = await prisma.userStorageQuota.update({
          where: { id: storageQuota.id },
          data: { allocatedBytes },
        });
      }

      // Calculate current usage from user files
      const currentUsage = await this.calculateUserStorageUsage(userId);

      // Update used bytes in quota record
      await prisma.userStorageQuota.update({
        where: { id: storageQuota.id },
        data: {
          usedBytes: currentUsage,
          lastUpdated: new Date(),
        },
      });

      const availableBytes = storageQuota.allocatedBytes - currentUsage;
      const usagePercentage = storageQuota.allocatedBytes > 0
        ? Number((currentUsage * BigInt(100)) / storageQuota.allocatedBytes)
        : 0;

      return {
        quota: {
          id: storageQuota.id,
          tier: storageQuota.tier,
          allocatedBytes: storageQuota.allocatedBytes.toString(),
          usedBytes: currentUsage.toString(),
          availableBytes: availableBytes.toString(),
          usagePercentage,
        },
        user: {
          storageTier: user.storageTier,
        },
      };
    } catch (error) {
      console.error('Failed to get user storage quota:', error);
      throw error;
    }
  }

  async checkStorageQuota(userId: string, additionalBytes: number): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage: string;
    totalQuota: string;
    availableBytes: string;
  }> {
    try {
      const { quota } = await this.getUserStorageQuota(userId);
      const additionalBytesBigInt = BigInt(additionalBytes);
      const availableBytesBigInt = BigInt(quota.availableBytes);

      const allowed = availableBytesBigInt >= additionalBytesBigInt;

      return {
        allowed,
        reason: allowed ? undefined : `Upload would exceed storage quota. Available: ${this.formatBytes(availableBytesBigInt)}, Required: ${this.formatBytes(additionalBytesBigInt)}`,
        currentUsage: quota.usedBytes,
        totalQuota: quota.allocatedBytes,
        availableBytes: quota.availableBytes,
      };
    } catch (error) {
      console.error('Failed to check storage quota:', error);
      throw error;
    }
  }

  async updateUserStorageTier(userId: string, newTier: StorageTier, updatedBy?: string): Promise<void> {
    try {
      const newAllocation = this.storageQuotaLimits[newTier];

      // Update user storage tier
      await prisma.user.update({
        where: { id: userId },
        data: { storageTier: newTier },
      });

      // Update or create storage quota record
      await prisma.userStorageQuota.upsert({
        where: { userId },
        update: {
          tier: newTier,
          allocatedBytes: newAllocation,
          tierUpdatedAt: new Date(),
          tierUpdatedBy: updatedBy,
          lastUpdated: new Date(),
        },
        create: {
          userId,
          tier: newTier,
          allocatedBytes: newAllocation,
          usedBytes: BigInt(0),
          tierUpdatedAt: new Date(),
          tierUpdatedBy: updatedBy,
        },
      });
    } catch (error) {
      console.error('Failed to update user storage tier:', error);
      throw error;
    }
  }

  async getUserStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: string;
    pinnedFiles: number;
    pinnedSize: string;
    fileTypes: Record<string, { count: number; size: string }>;
    quota: {
      tier: StorageTier;
      allocated: string;
      used: string;
      available: string;
      usagePercentage: number;
    };
  }> {
    try {
      const files = await prisma.userFile.findMany({
        where: { userId },
      });

      const { quota } = await this.getUserStorageQuota(userId);

      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.fileSize, BigInt(0));
      const pinnedFiles = files.filter(file => file.isPinned).length;
      const pinnedSize = files.filter(file => file.isPinned).reduce((sum, file) => sum + file.fileSize, BigInt(0));

      const fileTypes: Record<string, { count: number; size: string }> = {};
      files.forEach(file => {
        if (!fileTypes[file.fileType]) {
          fileTypes[file.fileType] = { count: 0, size: "0" };
        }
        fileTypes[file.fileType].count++;
        const currentSize = BigInt(fileTypes[file.fileType].size);
        fileTypes[file.fileType].size = (currentSize + file.fileSize).toString();
      });

      return {
        totalFiles,
        totalSize: totalSize.toString(),
        pinnedFiles,
        pinnedSize: pinnedSize.toString(),
        fileTypes,
        quota: {
          tier: quota.tier,
          allocated: quota.allocatedBytes,
          used: quota.usedBytes,
          available: quota.availableBytes,
          usagePercentage: quota.usagePercentage,
        },
      };
    } catch (error) {
      console.error('Failed to get user storage stats:', error);
      throw error;
    }
  }

  private async calculateUserStorageUsage(userId: string): Promise<bigint> {
    try {
      const result = await prisma.userFile.aggregate({
        where: { userId },
        _sum: {
          fileSize: true,
        },
      });

      return result._sum.fileSize || BigInt(0);
    } catch (error) {
      console.error('Failed to calculate user storage usage:', error);
      return BigInt(0);
    }
  }

  formatBytes(bytes: bigint): string {
    const bytesNum = Number(bytes);
    if (bytesNum === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytesNum) / Math.log(1024));
    return `${parseFloat((bytesNum / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  }

  getStorageTierDisplayName(tier: StorageTier): string {
    switch (tier) {
      case 'FREE_500MB':
        return 'Free (500MB)';
      case 'BASIC_5GB':
        return 'Basic (5GB)';
      case 'PRO_50GB':
        return 'Pro (10GB)';
      case 'ENTERPRISE_500GB':
        return 'Enterprise (500GB)';
      case 'UNLIMITED':
        return 'Unlimited';
      default:
        return 'Unknown';
    }
  }

  getStorageTierLimit(tier: StorageTier): bigint {
    return this.storageQuotaLimits[tier];
  }
}

export const storageQuotaService = new StorageQuotaService();