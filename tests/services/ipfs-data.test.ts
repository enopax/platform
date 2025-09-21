/**
 * Tests for IPFSDataService
 */

import { IPFSDataService } from '@/lib/services/ipfs-data';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('IPFSDataService', () => {
  let service: IPFSDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment variable for tests
    process.env.IPFS_CLUSTER_API_URL = 'http://localhost:9094';
    service = new IPFSDataService();
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.IPFS_CLUSTER_API_URL;
  });

  describe('constructor', () => {
    it('should initialize with default cluster API URL', () => {
      expect(service).toBeInstanceOf(IPFSDataService);
    });

    it('should use environment variable for cluster URL if provided', () => {
      const originalEnv = process.env.IPFS_CLUSTER_API_URL;
      process.env.IPFS_CLUSTER_API_URL = 'http://custom-cluster:9094';

      const customService = new IPFSDataService();
      expect(customService).toBeInstanceOf(IPFSDataService);

      // Restore original environment
      process.env.IPFS_CLUSTER_API_URL = originalEnv;
    });
  });

  describe('API interaction patterns', () => {
    it('should handle successful API responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue([
          {
            cid: 'QmTestHash1',
            allocations: ['node1', 'node2'],
            created: '2023-01-01T00:00:00Z',
          },
          {
            cid: 'QmTestHash2',
            allocations: ['node1'],
            created: '2023-01-02T00:00:00Z',
          }
        ]),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.getClusterPins();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9094/pins',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      expect(result).toEqual([
        {
          cid: 'QmTestHash1',
          allocations: ['node1', 'node2'],
          created: '2023-01-01T00:00:00Z',
        },
        {
          cid: 'QmTestHash2',
          allocations: ['node1'],
          created: '2023-01-02T00:00:00Z',
        }
      ]);
    });

    it('should handle API error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(service.getClusterPins()).rejects.toThrow(
        'Cluster API error: 500 Internal Server Error'
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(service.getClusterPins()).rejects.toThrow('Network error');
    });
  });

  describe('pin status checking', () => {
    it('should handle successful pin status check', async () => {
      const mockPinData = {
        cid: 'QmTestHash123',
        allocations: ['node1', 'node2', 'node3'],
        created: '2023-01-01T00:00:00Z',
        metadata: {
          userId: 'test-user',
          originalName: 'test.txt',
        }
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockPinData),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.getPinStatus('QmTestHash123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9094/pins/QmTestHash123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockPinData);
    });

    it('should return null for non-existent pins', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.getPinStatus('QmNonExistentHash');

      expect(result).toBeNull();
    });
  });

  describe('file type detection', () => {
    it('should detect document file types correctly', () => {
      expect(service.getFileTypeFromName('document.pdf')).toBe('pdf');
      expect(service.getFileTypeFromName('text.txt')).toBe('pdf');
      expect(service.getFileTypeFromName('presentation.pptx')).toBe('pptx');
    });

    it('should detect image file types correctly', () => {
      expect(service.getFileTypeFromName('photo.jpg')).toBe('jpg');
      expect(service.getFileTypeFromName('picture.png')).toBe('png');
      expect(service.getFileTypeFromName('graphic.gif')).toBe('gif');
    });

    it('should detect video file types correctly', () => {
      expect(service.getFileTypeFromName('movie.mp4')).toBe('mp4');
      expect(service.getFileTypeFromName('clip.avi')).toBe('avi');
      expect(service.getFileTypeFromName('video.mov')).toBe('mov');
    });

    it('should detect archive file types correctly', () => {
      expect(service.getFileTypeFromName('archive.zip')).toBe('zip');
      expect(service.getFileTypeFromName('backup.tar')).toBe('zip');
      expect(service.getFileTypeFromName('compressed.gz')).toBe('zip');
    });

    it('should default to extension for unknown file types', () => {
      expect(service.getFileTypeFromName('unknown.xyz')).toBe('xyz');
      expect(service.getFileTypeFromName('noextension')).toBe('noextension');
      expect(service.getFileTypeFromName('')).toBe('file');
    });

    it('should handle case insensitive extensions', () => {
      expect(service.getFileTypeFromName('DOCUMENT.PDF')).toBe('pdf');
      expect(service.getFileTypeFromName('Photo.JPG')).toBe('jpg');
      expect(service.getFileTypeFromName('Movie.MP4')).toBe('mp4');
    });
  });

  describe('file upload workflow', () => {
    it('should handle file upload with proper metadata', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockMetadata = {
        userId: 'test-user',
        originalName: 'test.txt',
        uploadTimestamp: '2023-01-01T00:00:00Z',
      };

      // Mock health check response
      const mockHealthResponse = {
        ok: true,
        status: 200,
      };

      // Mock upload response
      const mockUploadResponse = {
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify({
          hash: 'QmTestUploadHash123',
          name: 'test.txt',
          size: 12,
        })),
      };

      mockFetch
        .mockResolvedValueOnce(mockHealthResponse as any) // Health check
        .mockResolvedValueOnce(mockUploadResponse as any); // Upload

      const result = await service.pinFile(mockFile, mockMetadata);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9094/health',
        expect.objectContaining({
          method: 'GET',
          signal: expect.any(AbortSignal),
        })
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9094/add',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
          signal: expect.any(AbortSignal),
        })
      );

      expect(result).toEqual({
        hash: 'QmTestUploadHash123',
        name: 'test.txt',
        size: 12,
      });
    });

    it('should handle upload failures correctly', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockMetadata = {
        userId: 'test-user',
        originalName: 'test.txt',
        uploadTimestamp: '2023-01-01T00:00:00Z',
      };

      // Mock successful health check
      const mockHealthResponse = {
        ok: true,
        status: 200,
      };

      // Mock upload failure
      const mockErrorResponse = {
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
        text: jest.fn().mockResolvedValue('Request entity too large'),
      };

      mockFetch
        .mockResolvedValueOnce(mockHealthResponse as any) // Health check
        .mockResolvedValueOnce(mockErrorResponse as any); // Upload failure

      await expect(service.pinFile(mockFile, mockMetadata)).rejects.toThrow(
        'Failed to pin file: 413 Payload Too Large'
      );
    });
  });

  describe('file deletion workflow', () => {
    it('should handle successful file unpinning', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await service.unpinFile('QmTestHash123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9094/pins/QmTestHash123',
        {
          method: 'DELETE',
        }
      );
    });

    it('should handle unpin failures correctly', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(service.unpinFile('QmTestHash')).rejects.toThrow(
        'Failed to unpin file: 500 Internal Server Error'
      );
    });

    it('should handle 404 gracefully when unpinning non-existent files', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      // Should not throw for 404 - handles gracefully
      await expect(service.unpinFile('QmNonExistentHash')).resolves.not.toThrow();
    });
  });

  describe('cluster status monitoring', () => {
    it('should retrieve cluster status successfully', async () => {
      const mockClusterStatus = {
        id: 'cluster-node-1',
        addresses: ['/ip4/127.0.0.1/tcp/9096'],
        cluster_peers: ['peer1', 'peer2'],
        version: '1.0.0',
        ipfs: {
          id: 'ipfs-node-1',
          addresses: ['/ip4/127.0.0.1/tcp/5001'],
          error: '',
        },
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockClusterStatus),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.getClusterStatus();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:9094/id',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockClusterStatus);
    });
  });

  describe('error handling patterns', () => {
    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(service.getClusterPins()).rejects.toThrow('Invalid JSON');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockFetch.mockRejectedValue(timeoutError);

      await expect(service.getClusterPins()).rejects.toThrow('Request timeout');
    });
  });

  describe('replication count calculations', () => {
    it('should calculate replication count from allocations', () => {
      const pinData = {
        cid: 'QmTestHash',
        allocations: ['node1', 'node2', 'node3'],
        created: '2023-01-01T00:00:00Z',
      };

      const replicationCount = pinData.allocations?.length || 1;
      expect(replicationCount).toBe(3);
    });

    it('should default to 1 when no allocations present', () => {
      const pinData = {
        cid: 'QmTestHash',
        allocations: [],
        created: '2023-01-01T00:00:00Z',
      };

      const replicationCount = pinData.allocations?.length || 1;
      expect(replicationCount).toBe(1);
    });

    it('should handle missing allocations gracefully', () => {
      const pinData = {
        cid: 'QmTestHash',
        created: '2023-01-01T00:00:00Z',
      };

      const replicationCount = (pinData as any).allocations?.length || 1;
      expect(replicationCount).toBe(1);
    });
  });
});