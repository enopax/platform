import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { BarChart } from '@/components/graph/BarChart';
import { LineChart } from '@/components/graph/LineChart';
import { AreaChart } from '@/components/graph/AreaChart';
import { ProgressCircle } from '@/components/graph/ProgressCircle';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ipfsMetricsService } from '@/lib/services/ipfs-metrics';
import { seedSampleData, refreshAnalyticsData } from '@/actions/ipfs-tracking';
import {
  RiBarChartLine,
  RiTimeLine,
  RiDatabase2Line,
  RiCloudLine,
  RiHardDriveLine,
  RiRefreshLine,
  RiDownloadLine,
  RiUploadLine,
  RiPieChartLine,
  RiLineChartLine,
  RiEyeLine,
  RiArrowUpLine,
  RiArrowDownLine
} from '@remixicon/react';

// This function will be used inside the component after getting the data

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) return redirect('/');

  const user = session.user;
  
  // Get user-specific metrics
  const currentMetrics = await ipfsMetricsService.getUserCurrentMetrics(user.id);
  const historicalMetrics = await ipfsMetricsService.getUserMetrics(user.id, 15); // Last 15 days
  const recentActivity = await ipfsMetricsService.getRecentActivity(user.id, 10);
  
  // Convert bytes to GB for display
  const totalStorageGB = 50; // GB - could be from user plan
  const usedStorageGB = Number((currentMetrics.totalSize / (1024 ** 3)).toFixed(2));
  const storagePercentage = (usedStorageGB / totalStorageGB) * 100;

  // Prepare chart data from historical metrics
  const storageOverTime = historicalMetrics.map((metric, index) => ({
    date: `Day ${index + 1}`,
    used: Number((metric.totalSize / (1024 ** 3)).toFixed(2)),
    uploaded: metric.uploadCount,
    downloaded: metric.downloadCount
  }));

  const fileTypeData = [
    { type: 'Documents', count: currentMetrics.documentFiles, size: Math.round(currentMetrics.documentFiles * 0.5) },
    { type: 'Images', count: currentMetrics.imageFiles, size: Math.round(currentMetrics.imageFiles * 2.1) },
    { type: 'Videos', count: currentMetrics.videoFiles, size: Math.round(currentMetrics.videoFiles * 25.3) },
    { type: 'Archives', count: currentMetrics.archiveFiles, size: Math.round(currentMetrics.archiveFiles * 8.2) },
    { type: 'Other', count: currentMetrics.otherFiles, size: Math.round(currentMetrics.otherFiles * 1.2) }
  ];

  // Create daily activity data (last 7 days)
  const downloadActivity = historicalMetrics.slice(-7).map((metric, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] || `Day ${index + 1}`,
    downloads: metric.downloadCount,
    uploads: metric.uploadCount
  }));

  // Performance data from metrics
  const networkPerformance = historicalMetrics.slice(-6).map((metric, index) => ({
    time: `${index * 4}:00`,
    responseTime: metric.avgResponseTime,
    throughput: Math.round(45 + Math.random() * 20) // Mock throughput data
  }));

  // Node distribution (mock data - would come from IPFS cluster)
  const nodeDistribution = [
    { region: 'Local Node 1', files: Math.round(currentMetrics.totalFiles * 0.4), bandwidth: 2.4 },
    { region: 'Local Node 2', files: Math.round(currentMetrics.totalFiles * 0.3), bandwidth: 1.8 },
    { region: 'Local Node 3', files: Math.round(currentMetrics.totalFiles * 0.2), bandwidth: 1.2 },
    { region: 'Local Node 4', files: Math.round(currentMetrics.totalFiles * 0.1), bandwidth: 0.8 }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Storage Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Comprehensive insights into {user?.name || 'your'} IPFS storage performance and usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form action={refreshAnalyticsData}>
            <Button variant="outline" size="sm" type="submit">
              <RiRefreshLine className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </form>
          <Button variant="outline" size="sm">
            <RiDownloadLine className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <form action={seedSampleData}>
            <Button variant="outline" size="sm" type="submit">
              Seed Sample Data
            </Button>
          </form>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <RiHardDriveLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Storage</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{usedStorageGB} GB</p>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <RiArrowUpLine className="h-3 w-3" />
                <span>{currentMetrics.totalFiles} files</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <RiBarChartLine className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currentMetrics.downloadCount}</p>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <RiArrowUpLine className="h-3 w-3" />
                <span>{currentMetrics.uploadCount} uploads</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <RiTimeLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Response Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{currentMetrics.avgResponseTime}ms</p>
              <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <RiArrowUpLine className="h-3 w-3" />
                <span>{currentMetrics.availabilityRate.toFixed(1)}% uptime</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <RiCloudLine className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Nodes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">4</p>
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <span>All healthy</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Storage Utilization
          </h3>
          <div className="flex items-center justify-center mb-6">
            <ProgressCircle value={storagePercentage} className="h-32 w-32">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(storagePercentage)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Used
                </div>
              </div>
            </ProgressCircle>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Used</span>
              <span className="font-medium text-gray-900 dark:text-white">{usedStorageGB} GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Available</span>
              <span className="font-medium text-gray-900 dark:text-white">{(totalStorageGB - usedStorageGB).toFixed(2)} GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total</span>
              <span className="font-medium text-gray-900 dark:text-white">{totalStorageGB} GB</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Storage Growth Over Time
          </h3>
          <AreaChart
            data={storageOverTime}
            index="date"
            categories={["used", "uploaded"]}
            colors={["blue", "green"]}
            className="h-64"
          />
        </Card>
      </div>

      {/* Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Daily Activity
          </h3>
          <BarChart
            data={downloadActivity}
            index="day"
            categories={["downloads", "uploads"]}
            colors={["blue", "emerald"]}
            className="h-80"
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Network Performance
          </h3>
          <LineChart
            data={networkPerformance}
            index="time"
            categories={["responseTime"]}
            colors={["purple"]}
            className="h-80"
          />
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            File Types Distribution
          </h3>
          <BarChart
            data={fileTypeData}
            index="type"
            categories={["count"]}
            colors={["emerald"]}
            className="h-64"
          />
          <div className="mt-6 space-y-3">
            {fileTypeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.type}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.count} files
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.size > 1000 ? `${(item.size / 1000).toFixed(1)} GB` : `${item.size} MB`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Node Distribution
          </h3>
          <BarChart
            data={nodeDistribution}
            index="region"
            categories={["files"]}
            colors={["blue"]}
            className="h-64"
          />
          <div className="mt-6 space-y-3">
            {nodeDistribution.map((node, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="neutral">{node.region}</Badge>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {node.files} files
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {node.bandwidth} GB/s avg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit mx-auto mb-3">
              <RiArrowUpLine className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Availability</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{currentMetrics.availabilityRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">All time</p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit mx-auto mb-3">
              <RiLineChartLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Throughput</h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">42.3 MB/s</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Peak transfer rate</p>
          </div>
          
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit mx-auto mb-3">
              <RiPieChartLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Files Pinned</h4>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{currentMetrics.pinnedFiles}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total pinned files</p>
          </div>
        </div>
      </Card>
    </div>
  );
}