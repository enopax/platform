import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Badge } from '@/components/common/Badge';
import {
  RiProjectorLine,
  RiTeamLine,
  RiAddLine,
  RiBuildingLine,
  RiArrowRightLine
} from '@remixicon/react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await auth();

  const params = await searchParams;

  // If no organisation is selected, redirect to organisation selection
  if (!params.org) {
    return redirect('/orga');
  }

  const organisationId = params.org;

  // Verify user has access to this organisation
  const isAdmin = session.user.role === 'ADMIN';
  const membership = isAdmin ? true : await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: organisationId
      }
    }
  });

  if (!membership) {
    return redirect('/orga/organisations');
  }

  // Get organisation details
  const organisation = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: {
      _count: {
        select: {
          projects: true,
          teams: true,
          members: true
        }
      }
    }
  });

  if (!organisation) {
    return redirect('/orga/organisations');
  }

  // Get projects in this organisation
  const projects = await prisma.project.findMany({
    where: {
      organisationId,
      isActive: true
    },
    include: {
      assignedTeams: {
        include: {
          team: {
            select: {
              id: true,
              name: true,
              teamType: true
            }
          }
        }
      },
      _count: {
        select: {
          assignedTeams: true,
          allocatedResources: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Organisation Context */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <RiBuildingLine className="h-6 w-6 text-brand-600 dark:text-brand-400 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {organisation.name}
              </h1>
              <Link
                href="/orga/organisations"
                className="ml-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
              >
                Switch <RiArrowRightLine className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Select a project to manage teams, resources, and files
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/orga/new-project?org=${organisation.id}`}>
              <Button>
                <RiAddLine className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Organisation Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
                <RiProjectorLine className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {organisation._count.projects}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Projects</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
                <RiTeamLine className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {organisation._count.teams}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Teams</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                <RiProjectorLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {organisation._count.members}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Members</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Projects ({projects.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-all group cursor-pointer">
                <Link href={`/orga/${organisation.name}/${project.id}`} className="block">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl mr-4 flex-shrink-0 group-hover:bg-brand-200 dark:group-hover:bg-brand-900/50 transition-colors">
                        <RiProjectorLine className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg group-hover:text-brand-900 dark:group-hover:text-brand-100 transition-colors">
                          {project.name}
                        </h3>
                        <Badge variant={project.status === 'ACTIVE' ? 'success' : 'warning'} className="mt-1">
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.progress}%
                      </span>
                    </div>
                    <ProgressBar value={project.progress || 0} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <RiTeamLine className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {project._count.assignedTeams}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Teams
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <RiProjectorLine className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {project._count.allocatedResources}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Resources
                      </div>
                    </div>
                  </div>

                  {/* Teams */}
                  {project.assignedTeams.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Teams:</div>
                      <div className="flex flex-wrap gap-1">
                        {project.assignedTeams.slice(0, 3).map((assignment) => (
                          <Badge key={assignment.team.id} variant="outline" className="text-xs">
                            {assignment.team.name}
                          </Badge>
                        ))}
                        {project.assignedTeams.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.assignedTeams.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enter Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Updated {new Date(project.updatedAt).toLocaleDateString('en-GB')}
                    </div>
                    <div className="flex items-center text-sm text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                      Open <RiArrowRightLine className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <RiProjectorLine className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
            No Projects Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Create your first project in {organisation.name} to start managing teams, resources, and files.
          </p>
          <Link href={`/orga/new-project?org=${organisation.id}`}>
            <Button size="lg">
              <RiAddLine className="mr-2 h-5 w-5" />
              Create First Project
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}