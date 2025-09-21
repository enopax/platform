import { PrismaClient } from '@prisma/client';
import { ipfsDataService, UserFileInfo } from './ipfs-data';
import { ipfsMetricsService } from './ipfs-metrics';
import { teamStorageService } from './team-storage';

const prisma = new PrismaClient();

export class TeamFilesService {

  /**
   * Check if user can upload to a team (has storage quota available)
   */
  async checkTeamStorageQuota(userId: string, teamId: string, fileSizeBytes: number): Promise<{
    allowed: boolean;
    reason?: string;
    quotaInfo?: {
      allocated: number;
      used: number;
      available: number;
    };
  }> {
    try {
      // Check if user is member of the team
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId, teamId }
      });

      if (!teamMember) {
        return { allowed: false, reason: 'You are not a member of this team' };
      }

      // Use the new team storage service
      return await teamStorageService.checkTeamStorageQuota(teamId, fileSizeBytes);
    } catch (error) {
      console.error('Failed to check team storage quota:', error);
      return { allowed: false, reason: 'Failed to check storage quota' };
    }
  }

  /**
   * Upload file to team storage
   */
  async uploadFileToTeam(
    userId: string,
    teamId: string,
    projectId: string | null,
    file: File
  ): Promise<UserFileInfo> {
    const startTime = Date.now();

    try {
      // Check team storage quota first
      const quotaCheck = await this.checkTeamStorageQuota(userId, teamId, file.size);
      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.reason || 'Storage quota exceeded');
      }

      // Upload to IPFS cluster
      const uploadResult = await ipfsDataService.pinFile(file, {
        userId,
        teamId,
        projectId,
        originalName: file.name,
        uploadTimestamp: new Date().toISOString(),
      });

      const responseTime = Date.now() - startTime;
      const fileType = ipfsDataService.getFileTypeFromName(file.name);

      // Get pin status from cluster
      const pinStatus = await ipfsDataService.getPinStatus(uploadResult.hash);
      const replicationCount = pinStatus?.allocations?.length || 1;
      const nodeLocations = pinStatus?.allocations || [];

      // Save to database with team context
      const userFile = await prisma.userFile.create({
        data: {
          userId,
          teamId,
          projectId,
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
            teamId,
            projectId,
          },
        },
      });

      // Update team storage usage
      await teamStorageService.updateTeamStorageUsage(teamId);

      // Log the upload activity
      await ipfsMetricsService.logActivity(userId, 'upload', {
        fileName: file.name,
        fileSize: file.size,
        ipfsHash: uploadResult.hash,
        responseTime,
        success: true,
        teamId,
        projectId,
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
        teamId,
        projectId,
      });

      console.error('Failed to upload file to team:', error);
      throw error;
    }
  }


  /**
   * Delete file from team storage
   */
  async deleteTeamFile(userId: string, fileId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Get file record
      const userFile = await prisma.userFile.findFirst({
        where: { id: fileId, userId },
      });

      if (!userFile) {
        throw new Error('File not found or not owned by user');
      }

      // Check if user can delete (team member or file owner)
      if (userFile.teamId) {
        const teamMember = await prisma.teamMember.findFirst({
          where: { userId, teamId: userFile.teamId }
        });

        if (!teamMember) {
          throw new Error('You do not have permission to delete this team file');
        }
      }

      //Prisma Transaction??

      // Remove from IPFS cluster
      await ipfsDataService.unpinFile(userFile.ipfsHash);

      // Remove from database
      await prisma.userFile.delete({
        where: { id: fileId },
      });

      // Update team storage usage if it was a team file
      if (userFile.teamId) {
        await teamStorageService.updateTeamStorageUsage(userFile.teamId);
      }

      const responseTime = Date.now() - startTime;

      // Log the delete activity
      await ipfsMetricsService.logActivity(userId, 'delete', {
        fileName: userFile.fileName,
        ipfsHash: userFile.ipfsHash,
        responseTime,
        success: true,
        teamId: userFile.teamId,
        projectId: userFile.projectId,
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

      console.error('Failed to delete team file:', error);
      throw error;
    }
  }

  /**
   * Get team files with pagination
   */
  async getTeamFiles(
    userId: string,
    teamId: string,
    projectId?: string
  ): Promise<UserFileInfo[]> {
    try {
      // Check if user is team member
      const teamMember = await prisma.teamMember.findFirst({
        where: { userId, teamId }
      });

      if (!teamMember) {
        throw new Error('You are not a member of this team');
      }

      const whereClause: any = { teamId };
      if (projectId) {
        whereClause.projectId = projectId;
      }

      const userFiles = await prisma.userFile.findMany({
        where: whereClause,
        orderBy: { uploadedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstname: true,
              lastname: true,
            }
          },
          project: {
            select: {
              id: true,
              name: true,
            }
          }
        }
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
        // Additional team context
        uploadedBy: file.user,
        project: file.project,
      }));
    } catch (error) {
      console.error('Failed to fetch team files:', error);
      throw error;
    }
  }

  /**
   * Get team storage statistics
   */
  async getTeamStorageStats(teamId: string): Promise<{
    totalAllocated: number;
    totalUsed: number;
    totalFiles: number;
    availableSpace: number;
    storage?: {
      name: string;
      tier: string;
    };
  }> {
    try {
      const storage = await teamStorageService.getTeamStorage(teamId);
      const fileCount = await prisma.userFile.count({
        where: { teamId }
      });

      if (!storage) {
        return {
          totalAllocated: 0,
          totalUsed: 0,
          totalFiles: fileCount,
          availableSpace: 0,
        };
      }

      const totalAllocated = Number(storage.totalBytes);
      const totalUsed = Number(storage.usedBytes);

      return {
        totalAllocated,
        totalUsed,
        totalFiles: fileCount,
        availableSpace: totalAllocated - totalUsed,
        storage: {
          name: storage.name,
          tier: storage.tier,
        }
      };
    } catch (error) {
      console.error('Failed to get team storage stats:', error);
      throw error;
    }
  }
}

export const teamFilesService = new TeamFilesService();