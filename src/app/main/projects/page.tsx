import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Table from '@/components/GenericTable';
import { columns as teamColumns } from '@/components/table/ProjectTeam';
import {
  RiProjectorLine,
  RiAddLine,
  RiUserLine,
  RiTeamLine,
  RiCalendarLine,
  RiBarChartLine
} from '@remixicon/react';
import Link from 'next/link';

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) return null;

  // Fetch user's projects through team memberships and organisation memberships
  const userProjects = await prisma.project.findMany({
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
    include: {
      team: {
        include: {
          owner: true,
          organisation: true,
          _count: {
            select: {
              members: true,
              projects: true
            }
          }
        }
      }
    },
    orderBy: [
      { updatedAt: 'desc' }
    ]
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'COMPLETED': return 'secondary';
      case 'PLANNING': return 'outline';
      case 'ON_HOLD': return 'outline';
      case 'CANCELLED': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'default';
      case 'HIGH': return 'secondary';
      case 'MEDIUM': return 'outline';
      case 'LOW': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Projects
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your projects and discover new ones to join
            </p>
          </div>
          <Link href="/main/projects/new">
            <Button className="w-full sm:w-auto">
              <RiAddLine className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </div>
      </div>

      {/* My Projects Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          My Projects ({userProjects.length})
        </h2>

        {userProjects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {userProjects.map((project) => (
              <Card key={project.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3 flex-shrink-0">
                      <RiProjectorLine className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {project.team.organisation?.name || 'Personal Team'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs">
                      {project.status}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(project.priority)} className="text-xs">
                      {project.priority}
                    </Badge>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-brand-600 dark:bg-brand-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Project Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center">
                    <RiTeamLine className="h-3 w-3 mr-1" />
                    <span className="font-medium">{project.team._count.members}</span>
                    <span className="ml-1">team members</span>
                  </div>
                  {project.startDate && (
                    <div className="flex items-center">
                      <RiCalendarLine className="h-3 w-3 mr-1" />
                      <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {project.budget && (
                    <div className="flex items-center">
                      <RiBarChartLine className="h-3 w-3 mr-1" />
                      <span className="font-medium">{project.budget.toString()}</span>
                      <span className="ml-1">{project.currency}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Team: {project.team.name}
                  </div>
                  <Link href={`/main/projects/${project.id}`}>
                    <Button variant="outline" size="sm" className="text-xs px-3 py-1">
                      Edit Project
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <RiProjectorLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              You're not part of any projects yet. Create your first project or search for existing ones to join.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/main/projects/new">
                <Button>
                  <RiAddLine className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Teams Table Section */}
      {userProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Project Teams
          </h2>
          <Card className="overflow-hidden">
            <Table
              pageNumber={1}
              tableSize={userProjects.length}
              tableData={userProjects.map(p => p.team)}
              tableColumns={teamColumns}
            />
          </Card>
        </div>
      )}

      {/* Quick Actions Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Link href="/main/projects/new" className="group">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer">
              <RiAddLine className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Create New Project</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start a new project and assign it to a team
              </p>
            </div>
          </Link>

          <div className="opacity-50 cursor-not-allowed">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <RiUserLine className="h-6 w-6 text-gray-400 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Join Project</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Request to join existing projects (coming soon)
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}