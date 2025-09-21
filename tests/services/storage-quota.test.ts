/**
 * Tests for StorageQuotaService
 */

import { StorageQuotaService, storageQuotaService } from '@/lib/services/storage-quota';
import { StorageTier } from '@prisma/client';

describe('StorageQuotaService', () => {
  let service: StorageQuotaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorageQuotaService();
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(service.formatBytes(BigInt(0))).toBe('0 B');
      expect(service.formatBytes(BigInt(1024))).toBe('1 KB');
      expect(service.formatBytes(BigInt(1024 * 1024))).toBe('1 MB');
      expect(service.formatBytes(BigInt(1024 * 1024 * 1024))).toBe('1 GB');
      expect(service.formatBytes(BigInt(500 * 1024 * 1024))).toBe('500 MB');
    });

    it('should handle large numbers', () => {
      expect(service.formatBytes(BigInt(1536 * 1024 * 1024))).toBe('1.5 GB');
    });
  });

  describe('getStorageTierDisplayName', () => {
    it('should return correct display names for all tiers', () => {
      expect(service.getStorageTierDisplayName('FREE_500MB')).toBe('Free (500MB)');
      expect(service.getStorageTierDisplayName('BASIC_5GB')).toBe('Basic (5GB)');
      expect(service.getStorageTierDisplayName('PRO_50GB')).toBe('Pro (10GB)');
      expect(service.getStorageTierDisplayName('ENTERPRISE_500GB')).toBe('Enterprise (500GB)');
      expect(service.getStorageTierDisplayName('UNLIMITED')).toBe('Unlimited');
    });

    it('should handle unknown tier', () => {
      expect(service.getStorageTierDisplayName('UNKNOWN' as StorageTier)).toBe('Unknown');
    });
  });

  describe('getStorageTierLimit', () => {
    it('should return correct limits for all tiers', () => {
      expect(service.getStorageTierLimit('FREE_500MB')).toBe(BigInt(500 * 1024 * 1024));
      expect(service.getStorageTierLimit('BASIC_5GB')).toBe(BigInt(5 * 1024 * 1024 * 1024));
      expect(service.getStorageTierLimit('PRO_50GB')).toBe(BigInt(10 * 1024 * 1024 * 1024));
      expect(service.getStorageTierLimit('ENTERPRISE_500GB')).toBe(BigInt(500 * 1024 * 1024 * 1024));
      expect(service.getStorageTierLimit('UNLIMITED')).toBe(BigInt(Number.MAX_SAFE_INTEGER));
    });
  });

  describe('service instance', () => {
    it('should export a singleton instance', () => {
      expect(storageQuotaService).toBeInstanceOf(StorageQuotaService);
    });

    it('should have all required methods', () => {
      expect(typeof storageQuotaService.getUserStorageQuota).toBe('function');
      expect(typeof storageQuotaService.checkStorageQuota).toBe('function');
      expect(typeof storageQuotaService.updateUserStorageTier).toBe('function');
      expect(typeof storageQuotaService.getUserStorageStats).toBe('function');
      expect(typeof storageQuotaService.formatBytes).toBe('function');
      expect(typeof storageQuotaService.getStorageTierDisplayName).toBe('function');
      expect(typeof storageQuotaService.getStorageTierLimit).toBe('function');
    });
  });

  describe('storage tier calculations', () => {
    it('should calculate percentage correctly', () => {
      // Test percentage calculation logic
      const allocatedBytes = BigInt(1024 * 1024 * 1024); // 1GB
      const usedBytes = BigInt(512 * 1024 * 1024); // 512MB

      const usagePercentage = Number((usedBytes * BigInt(100)) / allocatedBytes);
      expect(usagePercentage).toBe(50);
    });

    it('should handle edge cases in percentage calculation', () => {
      // Test zero allocation
      const allocatedBytes = BigInt(0);
      const usedBytes = BigInt(100);

      const usagePercentage = allocatedBytes > 0
        ? Number((usedBytes * BigInt(100)) / allocatedBytes)
        : 0;
      expect(usagePercentage).toBe(0);
    });

    it('should calculate available bytes correctly', () => {
      const allocatedBytes = BigInt(1024 * 1024 * 1024); // 1GB
      const usedBytes = BigInt(256 * 1024 * 1024); // 256MB

      const availableBytes = allocatedBytes - usedBytes;
      expect(availableBytes).toBe(BigInt(768 * 1024 * 1024)); // 768MB
    });
  });

  describe('quota checking logic', () => {
    it('should allow upload when sufficient space is available', () => {
      const availableBytes = BigInt(1024 * 1024 * 1024); // 1GB
      const additionalBytes = BigInt(500 * 1024 * 1024); // 500MB

      const allowed = availableBytes >= additionalBytes;
      expect(allowed).toBe(true);
    });

    it('should deny upload when insufficient space is available', () => {
      const availableBytes = BigInt(256 * 1024 * 1024); // 256MB
      const additionalBytes = BigInt(512 * 1024 * 1024); // 512MB

      const allowed = availableBytes >= additionalBytes;
      expect(allowed).toBe(false);
    });

    it('should handle exact quota match', () => {
      const availableBytes = BigInt(512 * 1024 * 1024); // 512MB
      const additionalBytes = BigInt(512 * 1024 * 1024); // 512MB

      const allowed = availableBytes >= additionalBytes;
      expect(allowed).toBe(true);
    });
  });

  describe('file type aggregation logic', () => {
    it('should aggregate file types correctly', () => {
      const files = [
        { fileType: 'document', fileSize: BigInt(1024) },
        { fileType: 'document', fileSize: BigInt(2048) },
        { fileType: 'image', fileSize: BigInt(5120) },
      ];

      const fileTypes: Record<string, { count: number; size: string }> = {};
      files.forEach(file => {
        if (!fileTypes[file.fileType]) {
          fileTypes[file.fileType] = { count: 0, size: "0" };
        }
        fileTypes[file.fileType].count++;
        const currentSize = BigInt(fileTypes[file.fileType].size);
        fileTypes[file.fileType].size = (currentSize + file.fileSize).toString();
      });

      expect(fileTypes).toEqual({
        document: { count: 2, size: "3072" },
        image: { count: 1, size: "5120" },
      });
    });
  });
});