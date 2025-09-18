import { PrismaClient } from '@prisma/client';
import { ipfsDataService, UserFileInfo, ClusterPin } from './ipfs-data';
import { ipfsMetricsService } from './ipfs-metrics';

const prisma = new PrismaClient();

export class UserFilesService {
  
  async getUserFiles(userId: string): Promise<UserFileInfo[]> {
    try {
      const userFiles = await prisma.userFile.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
      });

      return userFiles.map(file => ({
        id: file.id,
        name: file.fileName,
        ipfsHash: file.ipfsHash,
        size: Number(file.fileSize),
        uploadedAt: file.uploadedAt,
        isPinned: file.isPinned,
        replicationCount: file.replicationCount,
        nodeLocations: file.nodeLocations,
        fileType: file.fileType,
        status: file.isPinned ? 'pinned' : 'stored' as const,
      }));
    } catch (error) {
      console.error('Failed to fetch user files:', error);
      throw error;
    }
  }

  async uploadFile(userId: string, file: File): Promise<UserFileInfo> {
    const startTime = Date.now();
    
    try {
      // Upload to IPFS cluster
      const uploadResult = await ipfsDataService.pinFile(file, {
        userId,
        originalName: file.name,
        uploadTimestamp: new Date().toISOString(),
      });

      const responseTime = Date.now() - startTime;
      const fileType = ipfsDataService.getFileTypeFromName(file.name);

      // Get pin status from cluster to determine replication
      const pinStatus = await ipfsDataService.getPinStatus(uploadResult.hash);
      const replicationCount = pinStatus?.allocations?.length || 1;
      const nodeLocations = pinStatus?.allocations || [];

      // Save to database
      const userFile = await prisma.userFile.create({
        data: {
          userId,
          ipfsHash: uploadResult.hash,
          fileName: file.name,
          fileSize: BigInt(file.size),
          fileType,
          isPinned: true,
          replicationCount,
          nodeLocations,
          metadata: {
            originalName: file.name,
            mimeType: file.type,
            uploadTimestamp: new Date().toISOString(),
          },
        },
      });

      // Log the upload activity
      await ipfsMetricsService.logActivity(userId, 'upload', {
        fileName: file.name,
        fileSize: file.size,
        ipfsHash: uploadResult.hash,
        responseTime,
        success: true,
      });

      return {
        id: userFile.id,
        name: userFile.fileName,
        ipfsHash: userFile.ipfsHash,
        size: Number(userFile.fileSize),
        uploadedAt: userFile.uploadedAt,
        isPinned: userFile.isPinned,
        replicationCount: userFile.replicationCount,
        nodeLocations: userFile.nodeLocations,
        fileType: userFile.fileType,
        status: 'pinned',
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log failed upload attempt
      await ipfsMetricsService.logActivity(userId, 'upload', {
        fileName: file.name,
        fileSize: file.size,
        responseTime,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  async deleteFile(userId: string, fileId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get file record
      const userFile = await prisma.userFile.findFirst({
        where: { id: fileId, userId },
      });

      if (!userFile) {
        throw new Error('File not found or not owned by user');
      }

      // Remove from IPFS cluster
      await ipfsDataService.unpinFile(userFile.ipfsHash);
      
      // Remove from database
      await prisma.userFile.delete({
        where: { id: fileId },
      });

      const responseTime = Date.now() - startTime;

      // Log the delete activity
      await ipfsMetricsService.logActivity(userId, 'delete', {
        fileName: userFile.fileName,
        ipfsHash: userFile.ipfsHash,
        responseTime,
        success: true,
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log failed delete attempt
      await ipfsMetricsService.logActivity(userId, 'delete', {
        fileName: 'unknown',
        responseTime,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  async syncUserFilesWithCluster(userId: string): Promise<void> {
    try {
      // Get all cluster pins
      const clusterPins = await ipfsDataService.getClusterPins();
      
      // Get user's files from database
      const userFiles = await prisma.userFile.findMany({
        where: { userId },
      });

      // Update pin status for each user file
      for (const userFile of userFiles) {
        const clusterPin = clusterPins.find(pin => pin.cid === userFile.ipfsHash);
        
        if (clusterPin) {
          // File still exists in cluster - update status
          await prisma.userFile.update({
            where: { id: userFile.id },
            data: {
              isPinned: true,
              replicationCount: clusterPin.allocations?.length || 1,
              nodeLocations: clusterPin.allocations || [],
              lastSyncAt: new Date(),
            },
          });
        } else {
          // File no longer in cluster - mark as not pinned
          await prisma.userFile.update({
            where: { id: userFile.id },
            data: {
              isPinned: false,
              replicationCount: 0,
              nodeLocations: [],
              lastSyncAt: new Date(),
            },
          });
        }
      }

      // Log sync activity
      await ipfsMetricsService.logActivity(userId, 'sync', {
        fileName: 'cluster-sync',
        responseTime: 100, // Approximate sync time
        success: true,
      });

    } catch (error) {
      console.error('Failed to sync user files with cluster:', error);
      
      // Log failed sync
      await ipfsMetricsService.logActivity(userId, 'sync', {
        fileName: 'cluster-sync',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  async getFileDownloadUrl(userId: string, fileId: string): Promise<string> {
    try {
      const userFile = await prisma.userFile.findFirst({
        where: { id: fileId, userId },
      });

      if (!userFile) {
        throw new Error('File not found or not owned by user');
      }

      // Log download activity
      await ipfsMetricsService.logActivity(userId, 'download', {
        fileName: userFile.fileName,
        ipfsHash: userFile.ipfsHash,
        responseTime: 50, // Approximate time to generate URL
        success: true,
      });

      // Return IPFS gateway URL (using first available node)
      return `http://localhost:8080/ipfs/${userFile.ipfsHash}?filename=${encodeURIComponent(userFile.fileName)}`;
      
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw error;
    }
  }

  async searchUserFiles(userId: string, query: string): Promise<UserFileInfo[]> {
    try {
      const userFiles = await prisma.userFile.findMany({
        where: {
          userId,
          fileName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });

      return userFiles.map(file => ({
        id: file.id,
        name: file.fileName,
        ipfsHash: file.ipfsHash,
        size: Number(file.fileSize),
        uploadedAt: file.uploadedAt,
        isPinned: file.isPinned,
        replicationCount: file.replicationCount,
        nodeLocations: file.nodeLocations,
        fileType: file.fileType,
        status: file.isPinned ? 'pinned' : 'stored' as const,
      }));
    } catch (error) {
      console.error('Failed to search user files:', error);
      throw error;
    }
  }

  async getUserStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    pinnedFiles: number;
    pinnedSize: number;
    fileTypes: Record<string, number>;
  }> {
    try {
      const files = await prisma.userFile.findMany({
        where: { userId },
      });

      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + Number(file.fileSize), 0);
      const pinnedFiles = files.filter(file => file.isPinned).length;
      const pinnedSize = files.filter(file => file.isPinned).reduce((sum, file) => sum + Number(file.fileSize), 0);

      const fileTypes: Record<string, number> = {};
      files.forEach(file => {
        fileTypes[file.fileType] = (fileTypes[file.fileType] || 0) + 1;
      });

      return {
        totalFiles,
        totalSize,
        pinnedFiles,
        pinnedSize,
        fileTypes,
      };
    } catch (error) {
      console.error('Failed to get user storage stats:', error);
      throw error;
    }
  }
}

export const userFilesService = new UserFilesService();