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
  RiVideoLine,
  RiBuildingLine,
  RiKeyLine,
  RiSettings3Line
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
  const [userProjects, userStorage, userCounts] = await Promise.all([
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
    getUserStorageMetrics(session.user.id),

    // Get counts for navigation cards
    Promise.all([
      // Count organisations where user is a member
      prisma.organisation.count({
        where: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      }),
      // Count teams where user is a member
      prisma.team.count({
        where: {
          OR: [
            {
              members: {
                some: {
                  userId: session.user.id
                }
              }
            },
            {
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
      }),
      // Count projects where user has access
      prisma.project.count({
        where: {
          team: {
            OR: [
              {
                members: {
                  some: {
                    userId: session.user.id
                  }
                }
              },
              {
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
        }
      }),
      // Count API keys for the user
      prisma.apiKey.count({
        where: {
          userId: session.user.id
        }
      })
    ])
  ]);

  // Destructure counts
  const [organisationsCount, teamsCount, projectsCount, apiKeysCount] = userCounts;

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
      {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {session.user.name || 'there'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Here's what's happening with your projects and storage.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/main/projects/create">
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Activity-First Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            {/* Recent Activity - Primary Focus */}
            <Card className="xl:col-span-2 p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <Link href="/main/projects" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
                View all →
              </Link>
            </div>

            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02] cursor-pointer">
                    <div className={`
                      p-2.5 rounded-xl flex-shrink-0 transition-transform duration-200 hover:scale-110
                      ${activity.type === 'upload' ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}
                      ${activity.type === 'project' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                      ${activity.type === 'team' ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                    `}>
                      {activity.type === 'upload' && <RiUploadLine className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                      {activity.type === 'project' && <RiProjectorLine className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                      {activity.type === 'team' && <RiTeamLine className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <RiProjectorLine className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recent activity</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first project.</p>
                <Link href="/main/projects/create">
                  <Button>
                    <RiAddLine className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Quick Stats & Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6 transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <Link href="/main/projects" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-[1.02] group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg transition-transform duration-200 group-hover:scale-110">
                      <RiProjectorLine className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Projects</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white transition-colors duration-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">{projectsCount}</span>
                </Link>

                <Link href="/main/teams" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <RiTeamLine className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teams</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{teamsCount}</span>
                </Link>

                <Link href="/main/organisations" className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <RiBuildingLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Organisations</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{organisationsCount}</span>
                </Link>
              </div>
            </Card>

            {/* Personal Account Actions */}
            <Card className="p-6 transition-all duration-300 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Account Actions
              </h3>
              <div className="space-y-3">
                <Link href="/account/upload" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start transition-all duration-200 hover:scale-105 hover:shadow-sm">
                    <RiUploadLine className="mr-2 h-4 w-4" />
                    Upload Personal Files
                  </Button>
                </Link>

                <Link href="/main/developer" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start transition-all duration-200 hover:scale-105 hover:shadow-sm">
                    <RiKeyLine className="mr-2 h-4 w-4" />
                    API Keys ({apiKeysCount})
                  </Button>
                </Link>

                <Link href="/account/settings" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start transition-all duration-200 hover:scale-105 hover:shadow-sm">
                    <RiSettings3Line className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Projects Section */}
        {projectsData.recent.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Active Projects
              </h2>
              <Link href="/main/projects" className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
                View all {projectsCount} projects →
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {projectsData.recent.map((project) => (
                <Link key={project.id} href={`/main/projects/${project.id}`} className="group">
                  <div className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colors">
                        <RiProjectorLine className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-900 dark:group-hover:text-brand-100 transition-colors truncate">
                          {project.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant={project.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {project.status}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {project.progress}% complete
                      </span>
                    </div>

                    <div className="mt-3">
                      <ProgressBar value={project.progress || 0} className="h-1.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions - Always Visible */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/main/projects/create" className="group">
              <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all text-center">
                <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-lg w-fit mx-auto mb-4 group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colors">
                  <RiProjectorLine className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create Project</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start a new project with resources</p>
              </div>
            </Link>

            <Link href="/account/upload" className="group">
              <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all text-center">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg w-fit mx-auto mb-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <RiUploadLine className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Files</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add files to IPFS storage</p>
              </div>
            </Link>

            <Link href="/main/teams/create" className="group">
              <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all text-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit mx-auto mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <RiTeamLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create Team</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Set up team collaboration</p>
              </div>
            </Link>
          </div>
        </Card>
    </div>
  );
}