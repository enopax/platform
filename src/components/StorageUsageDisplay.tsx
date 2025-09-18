'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Tracker } from '@/components/common/Tracker';
import {
  RiHardDriveLine,
  RiCloudLine,
  RiArrowUpLine,
  RiRefreshLine
} from '@remixicon/react';
import { getUserStorageQuotaAction, getUserStorageStatsAction, updateUserStorageTierAction } from '@/lib/actions/file-actions';

interface StorageQuotaData {
  quota: {
    id: string;
    tier: string;
    allocatedBytes: string;
    usedBytes: string;
    availableBytes: string;
    usagePercentage: number;
  };
  user: {
    storageTier: string;
  };
}

interface StorageStatsData {
  totalFiles: number;
  totalSize: string;
  pinnedFiles: number;
  pinnedSize: string;
  fileTypes: Record<string, { count: number; size: string }>;
  quota: {
    tier: string;
    allocated: string;
    used: string;
    available: string;
    usagePercentage: number;
  };
}

export default function StorageUsageDisplay() {
  const [quotaData, setQuotaData] = useState<StorageQuotaData | null>(null);
  const [statsData, setStatsData] = useState<StorageStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatBytes = (bytesStr: string | number): string => {
    const bytes = typeof bytesStr === 'string' ? parseInt(bytesStr) : bytesStr;
    if (bytes === 0 || isNaN(bytes) || bytes < 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getTierDisplayName = (tier: string): string => {
    switch (tier) {
      case 'FREE_500MB':
        return 'Free (500MB)';
      case 'BASIC_5GB':
        return 'Basic (5GB)';
      case 'PRO_50GB':
        return 'Pro (50GB)';
      case 'ENTERPRISE_500GB':
        return 'Enterprise (500GB)';
      case 'UNLIMITED':
        return 'Unlimited';
      default:
        return 'Unknown';
    }
  };

  const getTierBadgeVariant = (usagePercentage: number) => {
    if (usagePercentage >= 90) return 'destructive';
    if (usagePercentage >= 75) return 'warning';
    return 'success';
  };


  const generateTrackerData = (usagePercentage: number, usedBytes: string, totalBytes: string) => {
    const totalBlocks = 100; // Total number of blocks to display
    const usedBlocks = Math.round((usagePercentage / 100) * totalBlocks);
    const availableBlocks = totalBlocks - usedBlocks;

    const trackerData = [];

    // Add used storage blocks
    const usedColor = usagePercentage >= 90
      ? 'bg-red-500 dark:bg-red-400'
      : usagePercentage >= 75
        ? 'bg-amber-500 dark:bg-amber-400'
        : 'bg-blue-500 dark:bg-blue-400';

    for (let i = 0; i < usedBlocks; i++) {
      trackerData.push({
        color: usedColor,
        tooltip: `Used: ${formatBytes(usedBytes)} / ${formatBytes(totalBytes)} (${usagePercentage.toFixed(1)}%)`,
      });
    }

    // Add available storage blocks
    for (let i = 0; i < availableBlocks; i++) {
      trackerData.push({
        color: 'bg-gray-200 dark:bg-gray-600',
        tooltip: `Available: ${formatBytes(parseInt(totalBytes) - parseInt(usedBytes))}`,
      });
    }

    return trackerData;
  };

  const fetchStorageData = async () => {
    try {
      const [quotaResponse, statsResponse] = await Promise.all([
        getUserStorageQuotaAction(),
        getUserStorageStatsAction(),
      ]);

      if (quotaResponse.success && quotaResponse.data) {
        setQuotaData(quotaResponse.data as StorageQuotaData);
      }

      if (statsResponse.success && statsResponse.data) {
        setStatsData(statsResponse.data as StorageStatsData);
      }
    } catch (error) {
      console.error('Failed to fetch storage data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStorageData();
  };

  const handleUpgradeTo10GB = async () => {
    try {
      const formData = new FormData();
      formData.append('tier', 'PRO_50GB');
      const result = await updateUserStorageTierAction(formData);
      if (result.success) {
        await fetchStorageData(); // Refresh data after upgrade
        alert('Storage upgraded to 10GB successfully!');
      } else {
        alert(`Failed to upgrade: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to upgrade storage:', error);
      alert('Failed to upgrade storage');
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  const usageData = quotaData || statsData;
  if (!usageData) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Failed to load storage information
        </div>
      </Card>
    );
  }

  const quota = quotaData?.quota || statsData?.quota;
  if (!quota) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <RiHardDriveLine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Storage Usage
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getTierDisplayName(quota.tier)} Plan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={getTierBadgeVariant(quota.usagePercentage)}>
            {quota.usagePercentage.toFixed(1)}% Used
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh storage data"
          >
            <RiRefreshLine className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Usage Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatBytes(quota.used)} of {formatBytes(quota.allocated)} used
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatBytes(quota.available)} available
          </span>
        </div>

        <Tracker
          data={generateTrackerData(quota.usagePercentage, quota.used, quota.allocated)}
          className="h-6"
          hoverEffect={true}
        />
      </div>

      {/* Storage Stats */}
      {statsData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {statsData.totalFiles}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Files</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {statsData.pinnedFiles}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pinned Files</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatBytes(statsData.totalSize)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Size</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatBytes(statsData.pinnedSize)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pinned Size</div>
          </div>
        </div>
      )}

      {/* File Types Breakdown */}
      {statsData && Object.keys(statsData.fileTypes).length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            File Types
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(statsData.fileTypes).map(([type, data]) => (
              <div
                key={type}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 uppercase">
                    {type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {data.count} ({formatBytes(data.size)})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Prompt */}
      {quota.tier === 'FREE_500MB' && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <RiCloudLine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Upgrade to 10GB Storage
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Get more space for your IPFS files. Click below to upgrade to 10GB storage.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleUpgradeTo10GB}>
              <RiArrowUpLine className="mr-2 h-4 w-4" />
              Upgrade to 10GB
            </Button>
          </div>
        </div>
      )}

      {quota.usagePercentage >= 80 && quota.tier !== 'FREE_500MB' && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-3">
            <RiCloudLine className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Storage Running Low
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You're using {quota.usagePercentage.toFixed(1)}% of your storage quota.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}