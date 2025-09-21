/**
 * Simple service tests to verify the testing approach works
 */

import { userFilesService } from '@/lib/services/user-files';

// Mock the external dependencies
jest.mock('@/lib/services/ipfs-data', () => ({
  ipfsDataService: {
    pinFile: jest.fn(),
    unpinFile: jest.fn(),
    getFileTypeFromName: jest.fn(),
    getPinStatus: jest.fn(),
    getClusterPins: jest.fn(),
  },
}));

jest.mock('@/lib/services/ipfs-metrics', () => ({
  ipfsMetricsService: {
    logActivity: jest.fn(),
  },
}));

describe('UserFilesService - Simple Tests', () => {
  const testUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be instantiated', () => {
    expect(userFilesService).toBeDefined();
  });

  it('should have getUserFiles method', () => {
    expect(typeof userFilesService.getUserFiles).toBe('function');
  });

  it('should have uploadFile method', () => {
    expect(typeof userFilesService.uploadFile).toBe('function');
  });

  it('should have deleteFile method', () => {
    expect(typeof userFilesService.deleteFile).toBe('function');
  });

  it('should have syncUserFilesWithCluster method', () => {
    expect(typeof userFilesService.syncUserFilesWithCluster).toBe('function');
  });

  it('should have getFileDownloadUrl method', () => {
    expect(typeof userFilesService.getFileDownloadUrl).toBe('function');
  });

  it('should have searchUserFiles method', () => {
    expect(typeof userFilesService.searchUserFiles).toBe('function');
  });

  it('should have getUserStorageStats method', () => {
    expect(typeof userFilesService.getUserStorageStats).toBe('function');
  });
});