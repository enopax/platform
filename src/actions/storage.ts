'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StorageTier } from '@prisma/client';

// Storage tier to bytes mapping
const STORAGE_TIER_BYTES: Record<StorageTier, bigint> = {
  FREE_500MB: BigInt(500 * 1024 * 1024),        // 500 MB
  BASIC_5GB: BigInt(5 * 1024 * 1024 * 1024),    // 5 GB
  PRO_50GB: BigInt(50 * 1024 * 1024 * 1024),    // 50 GB
  ENTERPRISE_500GB: BigInt(500 * 1024 * 1024 * 1024), // 500 GB
  UNLIMITED: BigInt(Number.MAX_SAFE_INTEGER),    // Unlimited (max safe integer)
};

async function createOrUpdateUserStorageQuota(userId: string, tier: StorageTier) {
  const allocatedBytes = STORAGE_TIER_BYTES[tier];

  // Check if user already has a quota record
  const existingQuota = await prisma.userStorageQuota.findUnique({
    where: { userId }
  });

  if (existingQuota) {
    // Update existing quota
    await prisma.userStorageQuota.update({
      where: { userId },
      data: {
        tier,
        allocatedBytes,
        tierUpdatedAt: new Date(),
        lastUpdated: new Date(),
      }
    });
  } else {
    // Create new quota record
    await prisma.userStorageQuota.create({
      data: {
        userId,
        tier,
        allocatedBytes,
        usedBytes: BigInt(0),
        tierUpdatedAt: new Date(),
      }
    });
  }
}

export async function updateUserStorageTier(state: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session) {
      redirect('/');
    }

    const userId = formData.get('userId') as string;
    const storageTier = formData.get('storageTier') as StorageTier;

    // Validate that the user is updating their own storage tier
    if (userId !== session.user.id) {
      return { error: 'Unauthorized access' };
    }

    // Validate storage tier
    if (!storageTier || !Object.keys(STORAGE_TIER_BYTES).includes(storageTier)) {
      return { error: 'Invalid storage tier selected' };
    }

    // Update user's storage tier
    await prisma.user.update({
      where: { id: userId },
      data: {
        storageTier: storageTier,
      }
    });

    // Create or update user storage quota
    await createOrUpdateUserStorageQuota(userId, storageTier);

    revalidatePath('/main/storage-plans');
    revalidatePath('/main/files');

    return { success: true };
  } catch (error) {
    console.error('Failed to update storage tier:', error);
    return { error: 'Failed to update storage tier. Please try again.' };
  }
}

export async function getUserStorageInfo(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        storageTier: true,
        storageQuota: {
          select: {
            allocatedBytes: true,
            usedBytes: true,
            tier: true,
            lastUpdated: true,
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const quota = user.storageQuota;
    const tier = user.storageTier || 'FREE_500MB';

    return {
      tier,
      allocated: quota ? Number(quota.allocatedBytes) : Number(STORAGE_TIER_BYTES[tier as StorageTier]),
      used: quota ? Number(quota.usedBytes) : 0,
      available: quota
        ? Number(quota.allocatedBytes) - Number(quota.usedBytes)
        : Number(STORAGE_TIER_BYTES[tier as StorageTier]),
      lastUpdated: quota?.lastUpdated,
    };
  } catch (error) {
    console.error('Failed to get user storage info:', error);
    throw error;
  }
}

export async function checkStorageQuota(userId: string, fileSizeBytes: number): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const storageInfo = await getUserStorageInfo(userId);

    if (storageInfo.tier === 'UNLIMITED') {
      return { allowed: true };
    }

    const wouldExceed = storageInfo.used + fileSizeBytes > storageInfo.allocated;

    if (wouldExceed) {
      const availableGB = (storageInfo.available / (1024 ** 3)).toFixed(2);
      const fileGB = (fileSizeBytes / (1024 ** 3)).toFixed(2);

      return {
        allowed: false,
        reason: `File size (${fileGB} GB) exceeds available storage (${availableGB} GB). Please upgrade your plan.`
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Failed to check storage quota:', error);
    return { allowed: false, reason: 'Failed to check storage quota' };
  }
}