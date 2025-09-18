import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface IPFSFileMetadata {
  hash: string;
  name: string;
  size: number;
  isPinned: boolean;
  timestamp: Date;
  userId: string;
}

export interface StorageMetricsSummary {
  totalFiles: number;
  totalSize: number;
  pinnedFiles: number;
  pinnedSize: number;
  uploadCount: number;
  downloadCount: number;
  deleteCount: number;
  documentFiles: number;
  imageFiles: number;
  videoFiles: number;
  archiveFiles: number;
  otherFiles: number;
  avgResponseTime: number;
  availabilityRate: number;
}

export class IPFSMetricsService {
  
  async logActivity(userId: string, action: string, options?: {
    fileName?: string;
    fileSize?: number;
    ipfsHash?: string;
    responseTime?: number;
    success?: boolean;
    errorMessage?: string;
  }) {
    try {
      await prisma.userStorageActivity.create({
        data: {
          userId,
          action,
          fileName: options?.fileName,
          fileSize: options?.fileSize ? BigInt(options.fileSize) : null,
          ipfsHash: options?.ipfsHash,
          responseTime: options?.responseTime,
          success: options?.success ?? true,
          errorMessage: options?.errorMessage,
        }
      });
    } catch (error) {
      console.error('Failed to log storage activity:', error);
    }
  }

  async getFileTypeFromName(fileName: string): Promise<string> {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
    
    if (documentExtensions.includes(extension || '')) return 'document';
    if (imageExtensions.includes(extension || '')) return 'image';
    if (videoExtensions.includes(extension || '')) return 'video';
    if (archiveExtensions.includes(extension || '')) return 'archive';
    
    return 'other';
  }

  async aggregateDailyMetrics(userId: string, date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get activities for the day
    const activities = await prisma.userStorageActivity.findMany({
      where: {
        userId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });

    // Aggregate metrics from activities
    const uploadCount = activities.filter(a => a.action === 'upload').length;
    const downloadCount = activities.filter(a => a.action === 'download').length;
    const deleteCount = activities.filter(a => a.action === 'delete').length;

    // Calculate file type distribution from upload activities
    let documentFiles = 0, imageFiles = 0, videoFiles = 0, archiveFiles = 0, otherFiles = 0;
    
    for (const activity of activities.filter(a => a.action === 'upload')) {
      if (activity.fileName) {
        const fileType = await this.getFileTypeFromName(activity.fileName);
        switch (fileType) {
          case 'document': documentFiles++; break;
          case 'image': imageFiles++; break;
          case 'video': videoFiles++; break;
          case 'archive': archiveFiles++; break;
          default: otherFiles++; break;
        }
      }
    }

    // Calculate performance metrics
    const successfulActivities = activities.filter(a => a.success && a.responseTime);
    const avgResponseTime = successfulActivities.length > 0 
      ? Math.round(successfulActivities.reduce((sum, a) => sum + (a.responseTime || 0), 0) / successfulActivities.length)
      : 0;
    
    const availabilityRate = activities.length > 0 
      ? (activities.filter(a => a.success).length / activities.length) * 100 
      : 100;

    // Calculate total storage (this would ideally come from IPFS cluster API)
    const totalSize = activities
      .filter(a => a.action === 'upload' && a.fileSize)
      .reduce((sum, a) => sum + Number(a.fileSize || 0), 0);
    
    const totalFiles = activities.filter(a => a.action === 'upload').length;

    // Save or update daily metrics
    await prisma.userStorageMetrics.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfDay,
        }
      },
      update: {
        totalFiles,
        totalSize: BigInt(totalSize),
        pinnedFiles: totalFiles, // Assuming all uploaded files are pinned by default
        pinnedSize: BigInt(totalSize),
        uploadCount,
        downloadCount,
        deleteCount,
        documentFiles,
        imageFiles,
        videoFiles,
        archiveFiles,
        otherFiles,
        avgResponseTime,
        availabilityRate,
      },
      create: {
        userId,
        date: startOfDay,
        totalFiles,
        totalSize: BigInt(totalSize),
        pinnedFiles: totalFiles,
        pinnedSize: BigInt(totalSize),
        uploadCount,
        downloadCount,
        deleteCount,
        documentFiles,
        imageFiles,
        videoFiles,
        archiveFiles,
        otherFiles,
        avgResponseTime,
        availabilityRate,
      }
    });
  }

  async getUserMetrics(userId: string, days: number = 30): Promise<StorageMetricsSummary[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const metrics = await prisma.userStorageMetrics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: {
        date: 'asc',
      }
    });

    return metrics.map(metric => ({
      totalFiles: metric.totalFiles,
      totalSize: Number(metric.totalSize),
      pinnedFiles: metric.pinnedFiles,
      pinnedSize: Number(metric.pinnedSize),
      uploadCount: metric.uploadCount,
      downloadCount: metric.downloadCount,
      deleteCount: metric.deleteCount,
      documentFiles: metric.documentFiles,
      imageFiles: metric.imageFiles,
      videoFiles: metric.videoFiles,
      archiveFiles: metric.archiveFiles,
      otherFiles: metric.otherFiles,
      avgResponseTime: metric.avgResponseTime,
      availabilityRate: metric.availabilityRate,
    }));
  }

  async getUserCurrentMetrics(userId: string): Promise<StorageMetricsSummary> {
    // Get the latest metrics or calculate from all-time activity
    const latestMetrics = await prisma.userStorageMetrics.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    if (latestMetrics) {
      return {
        totalFiles: latestMetrics.totalFiles,
        totalSize: Number(latestMetrics.totalSize),
        pinnedFiles: latestMetrics.pinnedFiles,
        pinnedSize: Number(latestMetrics.pinnedSize),
        uploadCount: latestMetrics.uploadCount,
        downloadCount: latestMetrics.downloadCount,
        deleteCount: latestMetrics.deleteCount,
        documentFiles: latestMetrics.documentFiles,
        imageFiles: latestMetrics.imageFiles,
        videoFiles: latestMetrics.videoFiles,
        archiveFiles: latestMetrics.archiveFiles,
        otherFiles: latestMetrics.otherFiles,
        avgResponseTime: latestMetrics.avgResponseTime,
        availabilityRate: latestMetrics.availabilityRate,
      };
    }

    // If no metrics exist, calculate from activity log
    const activities = await prisma.userStorageActivity.findMany({
      where: { userId }
    });

    const uploadActivities = activities.filter(a => a.action === 'upload');
    const totalSize = uploadActivities.reduce((sum, a) => sum + Number(a.fileSize || 0), 0);
    const totalFiles = uploadActivities.length;

    let documentFiles = 0, imageFiles = 0, videoFiles = 0, archiveFiles = 0, otherFiles = 0;
    for (const activity of uploadActivities) {
      if (activity.fileName) {
        const fileType = await this.getFileTypeFromName(activity.fileName);
        switch (fileType) {
          case 'document': documentFiles++; break;
          case 'image': imageFiles++; break;
          case 'video': videoFiles++; break;
          case 'archive': archiveFiles++; break;
          default: otherFiles++; break;
        }
      }
    }

    const successfulActivities = activities.filter(a => a.success && a.responseTime);
    const avgResponseTime = successfulActivities.length > 0 
      ? Math.round(successfulActivities.reduce((sum, a) => sum + (a.responseTime || 0), 0) / successfulActivities.length)
      : 0;
    
    const availabilityRate = activities.length > 0 
      ? (activities.filter(a => a.success).length / activities.length) * 100 
      : 100;

    return {
      totalFiles,
      totalSize,
      pinnedFiles: totalFiles,
      pinnedSize: totalSize,
      uploadCount: uploadActivities.length,
      downloadCount: activities.filter(a => a.action === 'download').length,
      deleteCount: activities.filter(a => a.action === 'delete').length,
      documentFiles,
      imageFiles,
      videoFiles,
      archiveFiles,
      otherFiles,
      avgResponseTime,
      availabilityRate,
    };
  }

  async getRecentActivity(userId: string, limit: number = 50) {
    return await prisma.userStorageActivity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  // Method to sync with IPFS cluster - called periodically
  async syncWithIPFSCluster(userId: string): Promise<void> {
    try {
      // This would integrate with the IPFS cluster API to get real file data
      // For now, we'll just log a sync activity
      await this.logActivity(userId, 'sync', {
        fileName: 'cluster-sync',
        responseTime: Math.floor(Math.random() * 200) + 50,
        success: true,
      });
    } catch (error) {
      console.error('Failed to sync with IPFS cluster:', error);
      await this.logActivity(userId, 'sync', {
        fileName: 'cluster-sync',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const ipfsMetricsService = new IPFSMetricsService();