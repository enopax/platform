'use server';

import { auth } from '@/lib/auth';
import { ipfsMetricsService } from '@/lib/services/ipfs-metrics';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function trackUploadActivity(fileName: string, fileSize: number, ipfsHash: string, responseTime: number) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    await ipfsMetricsService.logActivity(session.user.id, 'upload', {
      fileName,
      fileSize,
      ipfsHash,
      responseTime,
      success: true,
    });

    // Optionally aggregate daily metrics after upload
    await ipfsMetricsService.aggregateDailyMetrics(session.user.id, new Date());

    return { success: true };
  } catch (error) {
    console.error('Failed to track upload activity:', error);
    
    // Log the failed attempt
    await ipfsMetricsService.logActivity(session.user.id, 'upload', {
      fileName,
      fileSize,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return { success: false, error: 'Failed to track activity' };
  }
}

export async function trackDownloadActivity(fileName: string, ipfsHash: string, responseTime: number) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    await ipfsMetricsService.logActivity(session.user.id, 'download', {
      fileName,
      ipfsHash,
      responseTime,
      success: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to track download activity:', error);
    
    await ipfsMetricsService.logActivity(session.user.id, 'download', {
      fileName,
      ipfsHash,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return { success: false, error: 'Failed to track activity' };
  }
}

export async function trackDeleteActivity(fileName: string, ipfsHash: string, responseTime: number) {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    await ipfsMetricsService.logActivity(session.user.id, 'delete', {
      fileName,
      ipfsHash,
      responseTime,
      success: true,
    });

    // Update daily metrics after delete
    await ipfsMetricsService.aggregateDailyMetrics(session.user.id, new Date());

    return { success: true };
  } catch (error) {
    console.error('Failed to track delete activity:', error);
    
    await ipfsMetricsService.logActivity(session.user.id, 'delete', {
      fileName,
      ipfsHash,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return { success: false, error: 'Failed to track activity' };
  }
}

export async function syncUserMetricsWithIPFS() {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    await ipfsMetricsService.syncWithIPFSCluster(session.user.id);
    await ipfsMetricsService.aggregateDailyMetrics(session.user.id, new Date());

    return { success: true };
  } catch (error) {
    console.error('Failed to sync metrics with IPFS:', error);
    return { success: false, error: 'Failed to sync metrics' };
  }
}

export async function refreshAnalyticsData() {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const userId = session.user.id;
    
    // Sync with IPFS cluster to get latest data
    await ipfsMetricsService.syncWithIPFSCluster(userId);
    
    // Re-aggregate metrics for today
    await ipfsMetricsService.aggregateDailyMetrics(userId, new Date());
    
    // You could also refresh data from the past few days
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - i);
      await ipfsMetricsService.aggregateDailyMetrics(userId, pastDate);
    }

    // Revalidate the analytics page to show fresh data
    revalidatePath('/main/files/analytics');
    
    return { success: true, message: 'Analytics data refreshed successfully' };
  } catch (error) {
    console.error('Failed to refresh analytics data:', error);
    return { success: false, error: 'Failed to refresh analytics data' };
  }
}

export async function seedSampleData() {
  const session = await auth();
  if (!session) return redirect('/');

  try {
    const userId = session.user.id;
    
    // Create some sample activities for demonstration
    const sampleFiles = [
      { name: 'document.pdf', size: 2500000, hash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' },
      { name: 'image.jpg', size: 1200000, hash: 'QmYoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' },
      { name: 'video.mp4', size: 125000000, hash: 'QmZoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' },
      { name: 'archive.zip', size: 8500000, hash: 'QmAoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' },
      { name: 'readme.txt', size: 15000, hash: 'QmBoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' }
    ];

    // Log sample upload activities
    for (const file of sampleFiles) {
      await ipfsMetricsService.logActivity(userId, 'upload', {
        fileName: file.name,
        fileSize: file.size,
        ipfsHash: file.hash,
        responseTime: Math.floor(Math.random() * 300) + 50,
        success: true,
      });
    }

    // Log some download activities
    for (let i = 0; i < 3; i++) {
      const file = sampleFiles[i];
      await ipfsMetricsService.logActivity(userId, 'download', {
        fileName: file.name,
        ipfsHash: file.hash,
        responseTime: Math.floor(Math.random() * 150) + 30,
        success: true,
      });
    }

    // Aggregate the daily metrics
    await ipfsMetricsService.aggregateDailyMetrics(userId, new Date());

    // Revalidate the analytics page to show the new sample data
    revalidatePath('/main/files/analytics');
    
    return { success: true, message: 'Sample data seeded successfully' };
  } catch (error) {
    console.error('Failed to seed sample data:', error);
    return { success: false, error: 'Failed to seed sample data' };
  }
}