import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Badge } from '@/components/common/Badge';
import {
  RiProjectorLine,
  RiTeamLine,
  RiFolderLine,
  RiUploadLine,
  RiAddLine,
  RiUserAddLine,
  RiDatabaseLine,
  RiFileTextLine,
  RiImageLine,
  RiVideoLine
} from '@remixicon/react';
import Link from 'next/link';

// Function to format bytes for display
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Function to get user's personal storage metrics
async function getUserStorageMetrics(userId: string) {
  try {
    // Get user's storage quota and usage
    const userQuota = await prisma.userStorageQuota.findUnique({
      where: { userId },
    });

    // Get user's files summary
    const fileStats = await prisma.userFile.aggregate({
      where: { userId },
      _sum: { fileSize: true },
      _count: { id: true },
    });

    // Get file type breakdown
    const filesByType = await prisma.userFile.groupBy({
      by: ['fileType'],
      where: { userId },
      _count: { id: true },
      _sum: { fileSize: true },
    });

    // Get recent storage activity
    const recentActivity = await prisma.userStorageActivity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    // Calculate storage metrics
    const totalFiles = fileStats._count.id || 0;
    const totalSize = Number(fileStats._sum.fileSize || 0);
    const allocatedBytes = Number(userQuota?.allocatedBytes || 524288000); // Default 500MB
    const usedBytes = Number(userQuota?.usedBytes || totalSize);

    // File type breakdown
    const fileTypeStats = {
      documents: 0,
      images: 0,
      videos: 0,
      others: 0,
    };

    filesByType.forEach((group) => {
      const type = group.fileType.toLowerCase();
      const count = group._count.id;

      if (type.includes('pdf') || type.includes('doc') || type.includes('txt')) {
        fileTypeStats.documents += count;
      } else if (type.includes('image') || type.includes('jpg') || type.includes('png')) {
        fileTypeStats.images += count;
      } else if (type.includes('video') || type.includes('mp4') || type.includes('avi')) {
        fileTypeStats.videos += count;
      } else {
        fileTypeStats.others += count;
      }
    });

    return {
      totalFiles,
      totalSize,
      allocatedBytes,
      usedBytes,
      availableBytes: Math.max(0, allocatedBytes - usedBytes),
      fileTypeStats,
      recentActivity,
      tier: userQuota?.tier || 'FREE_500MB',
    };
  } catch (error) {
    console.error('Error fetching user storage metrics:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      allocatedBytes: 524288000, // Default 500MB
      usedBytes: 0,
      availableBytes: 524288000,
      fileTypeStats: { documents: 0, images: 0, videos: 0, others: 0 },
      recentActivity: [],
      tier: 'FREE_500MB',
    };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  // Fetch personal data from database
  const [userProjects, userStorage] = await Promise.all([
    // Get user's projects through team memberships and organisation memberships
    prisma.project.findMany({
      where: {
        team: {
          OR: [
            {
              // User is a member of the team
              members: {
                some: {
                  userId: session.user.id
                }
              }
            },
            {
              // User is a member of the organisation (if team belongs to one)
              organisation: {
                members: {
                  some: {
                    userId: session.user.id
                  }
                }
              }
            }
          ]
        }
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        updatedAt: true
      },
      orderBy: [
        { updatedAt: 'desc' }
      ],
      take: 5 // Only get 5 most recent projects for the dashboard
    }),

    // Get user's personal storage metrics
    getUserStorageMetrics(session.user.id)
  ]);

  // Calculate aggregated personal data
  const projectsData = {
    recent: userProjects.slice(0, 3) // Top 3 for dashboard display
  };

  // Use personal storage data
  const storageData = {
    used: userStorage.usedBytes,
    total: userStorage.allocatedBytes,
    available: userStorage.availableBytes,
    fileCount: userStorage.totalFiles,
    tier: userStorage.tier,
    fileTypeStats: userStorage.fileTypeStats
  };

  // Generate recent activity from personal storage activity
  const recentActivity = [
    ...userProjects.slice(0, 2).map(project => ({
      type: 'project' as const,
      description: `Updated ${project.name}`,
      time: new Date(project.updatedAt).toLocaleDateString()
    })),
    ...userStorage.recentActivity.slice(0, 3).map(activity => ({
      type: 'upload' as const,
      description: activity.fileName ? `${activity.action} ${activity.fileName}` : `File ${activity.action}`,
      time: new Date(activity.timestamp).toLocaleDateString()
    }))
  ];

  const storagePercentage = storageData.total > 0 ? (storageData.used / storageData.total) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Welcome back! Here's your personal overview and recent activity.
        </p>
      </div>

        {/* File Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Documents
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {storageData.fileTypeStats.documents}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <RiFileTextLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Images
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {storageData.fileTypeStats.images}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <RiImageLine className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Videos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {storageData.fileTypeStats.videos}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <RiVideoLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Other Files
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {storageData.fileTypeStats.others}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <RiFolderLine className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Personal Storage Usage */}
          <Card className="lg:col-span-1 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              My Storage Usage
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Used Storage</span>
                  <span>
                    {formatBytes(storageData.used)} of {formatBytes(storageData.total)}
                  </span>
                </div>
                <ProgressBar value={storagePercentage} className="h-2" />
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Files</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {storageData.fileCount}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Storage Tier</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {storageData.tier.replace('_', ' ')}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Available</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatBytes(storageData.available)}
                </span>
              </div>
            </div>
          </Card>

          {/* My Recent Activity */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              My Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg flex-shrink-0
                    ${activity.type === 'upload' ? 'bg-green-100 dark:bg-green-900/30' : ''}
                    ${activity.type === 'project' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                    ${activity.type === 'team' ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                  `}>
                    {activity.type === 'upload' && <RiUploadLine className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {activity.type === 'project' && <RiProjectorLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    {activity.type === 'team' && <RiTeamLine className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Projects Section */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Projects
            </h3>
            <Link href="/main/projects/new">
              <Button variant="outline" size="sm">
                <RiAddLine className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {projectsData.recent.length > 0 ? (
              projectsData.recent.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                      <RiProjectorLine className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={project.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {project.status}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {project.progress}% complete
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/main/projects/${project.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <RiProjectorLine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No projects yet. Create your first project to get started.
                </p>
                <Link href="/main/projects/new">
                  <Button>
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/account/upload" className="group">
              <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors text-center">
                <RiUploadLine className="h-8 w-8 text-gray-400 group-hover:text-brand-500 mb-2 mx-auto" />
                <h4 className="font-medium text-gray-900 dark:text-white">Upload Files</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add files to IPFS storage</p>
              </div>
            </Link>
            
            <Link href="/main/projects/new" className="group">
              <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors text-center">
                <RiProjectorLine className="h-8 w-8 text-gray-400 group-hover:text-brand-500 mb-2 mx-auto" />
                <h4 className="font-medium text-gray-900 dark:text-white">Create Project</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start a new project</p>
              </div>
            </Link>
            
            <div className="group opacity-50 cursor-not-allowed">
              <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                <RiUserAddLine className="h-8 w-8 text-gray-400 mb-2 mx-auto" />
                <h4 className="font-medium text-gray-900 dark:text-white">Invite Members</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
              </div>
            </div>
          </div>
        </Card>
    </div>
  );
}