import { PrismaClient } from '@prisma/client';
import { StorageTier } from '@prisma/client';

const prisma = new PrismaClient();

export class TeamStorageService {

  /**
   * Get storage tiers with pricing and limits
   */
  getStorageTiers() {
    return [
      {
        tier: 'FREE_500MB' as StorageTier,
        name: 'Free',
        storage: '500 MB',
        price: 0,
        bytes: 500 * 1024 * 1024,
        features: ['Basic IPFS storage', 'Community support'],
      },
      {
        tier: 'BASIC_5GB' as StorageTier,
        name: 'Basic',
        storage: '5 GB',
        price: 9.99,
        bytes: 5 * 1024 * 1024 * 1024,
        features: ['5GB IPFS storage', 'Priority support', 'Basic analytics'],
      },
      {
        tier: 'PRO_50GB' as StorageTier,
        name: 'Pro',
        storage: '50 GB',
        price: 29.99,
        bytes: 50 * 1024 * 1024 * 1024,
        features: ['50GB IPFS storage', 'Advanced analytics', 'API access', 'Priority support'],
      },
      {
        tier: 'ENTERPRISE_500GB' as StorageTier,
        name: 'Enterprise',
        storage: '500 GB',
        price: 99.99,
        bytes: 500 * 1024 * 1024 * 1024,
        features: ['500GB IPFS storage', 'Advanced analytics', 'API access', 'Dedicated support', 'Custom integrations'],
      },
      {
        tier: 'UNLIMITED' as StorageTier,
        name: 'Unlimited',
        storage: 'Unlimited',
        price: 199.99,
        bytes: Number.MAX_SAFE_INTEGER,
        features: ['Unlimited IPFS storage', 'All features', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
      },
    ];
  }

  /**
   * Create team storage resource (purchased by team leader)
   */
  async createTeamStorage(
    teamId: string,
    purchasedBy: string,
    tier: StorageTier,
    name?: string,
    description?: string
  ) {
    const tierInfo = this.getStorageTiers().find(t => t.tier === tier);
    if (!tierInfo) {
      throw new Error('Invalid storage tier');
    }

    // Check if team already has storage
    const existingStorage = await prisma.teamStorageResource.findUnique({
      where: { teamId }
    });

    if (existingStorage) {
      throw new Error('Team already has a storage resource');
    }

    // Verify the user can manage the team (is owner or lead)
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: purchasedBy }
        }
      }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const isOwner = team.ownerId === purchasedBy;
    const isLead = team.members.some(m => m.userId === purchasedBy && m.role === 'LEAD');

    if (!isOwner && !isLead) {
      throw new Error('Only team owners or leads can purchase storage');
    }

    return await prisma.teamStorageResource.create({
      data: {
        teamId,
        name: name || `${team.name} Storage`,
        description,
        tier,
        totalBytes: BigInt(tierInfo.bytes),
        purchasedBy,
      },
      include: {
        team: {
          select: {
            name: true,
          }
        }
      }
    });
  }

  /**
   * Get team storage resource
   */
  async getTeamStorage(teamId: string) {
    return await prisma.teamStorageResource.findUnique({
      where: { teamId },
      include: {
        team: {
          select: {
            name: true,
          }
        },
        purchaser: {
          select: {
            name: true,
            firstname: true,
            lastname: true,
            email: true,
          }
        }
      }
    });
  }

  /**
   * Update team storage tier
   */
  async updateTeamStorage(
    teamId: string,
    userId: string,
    updates: {
      tier?: StorageTier;
      name?: string;
      description?: string;
    }
  ) {
    const storage = await prisma.teamStorageResource.findUnique({
      where: { teamId },
      include: {
        team: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!storage) {
      throw new Error('Team storage not found');
    }

    // Verify permissions
    const isOwner = storage.team.ownerId === userId;
    const isLead = storage.team.members.some(m => m.userId === userId && m.role === 'LEAD');

    if (!isOwner && !isLead) {
      throw new Error('Only team owners or leads can update storage');
    }

    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;

    if (updates.tier) {
      const tierInfo = this.getStorageTiers().find(t => t.tier === updates.tier);
      if (!tierInfo) {
        throw new Error('Invalid storage tier');
      }
      updateData.tier = updates.tier;
      updateData.totalBytes = BigInt(tierInfo.bytes);
    }

    return await prisma.teamStorageResource.update({
      where: { teamId },
      data: updateData,
      include: {
        team: {
          select: {
            name: true,
          }
        }
      }
    });
  }

  /**
   * Delete team storage
   */
  async deleteTeamStorage(teamId: string, userId: string) {
    const storage = await prisma.teamStorageResource.findUnique({
      where: { teamId },
      include: {
        team: true
      }
    });

    if (!storage) {
      throw new Error('Team storage not found');
    }

    // Only team owner can delete storage
    if (storage.team.ownerId !== userId) {
      throw new Error('Only team owner can delete storage');
    }

    // Check if there are files stored
    const fileCount = await prisma.userFile.count({
      where: { teamId }
    });

    if (fileCount > 0) {
      throw new Error('Cannot delete storage with existing files. Please delete all files first.');
    }

    return await prisma.teamStorageResource.delete({
      where: { teamId }
    });
  }

  /**
   * Check team storage quota for file upload
   */
  async checkTeamStorageQuota(teamId: string, fileSizeBytes: number) {
    const storage = await this.getTeamStorage(teamId);

    if (!storage) {
      return {
        allowed: false,
        reason: 'Team has no storage resource'
      };
    }

    if (!storage.isActive) {
      return {
        allowed: false,
        reason: 'Team storage is inactive'
      };
    }

    const available = Number(storage.totalBytes - storage.usedBytes);

    if (fileSizeBytes > available) {
      const availableGB = (available / (1024 ** 3)).toFixed(2);
      const fileGB = (fileSizeBytes / (1024 ** 3)).toFixed(2);

      return {
        allowed: false,
        reason: `File size (${fileGB} GB) exceeds available team storage (${availableGB} GB)`
      };
    }

    return {
      allowed: true,
      quotaInfo: {
        allocated: Number(storage.totalBytes),
        used: Number(storage.usedBytes),
        available
      }
    };
  }

  /**
   * Update team storage usage after file operations
   */
  async updateTeamStorageUsage(teamId: string) {
    const totalUsage = await prisma.userFile.aggregate({
      where: { teamId },
      _sum: { fileSize: true }
    });

    const currentUsage = totalUsage._sum.fileSize || BigInt(0);

    return await prisma.teamStorageResource.update({
      where: { teamId },
      data: {
        usedBytes: currentUsage,
        updatedAt: new Date(),
      }
    });
  }
}

export const teamStorageService = new TeamStorageService();