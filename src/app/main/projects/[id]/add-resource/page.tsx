import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  RiArrowLeftLine,
  RiProjectorLine,
  RiAddLine,
  RiServerLine
} from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CreateResourceForm from '@/components/form/CreateResourceForm';

interface AddResourcePageProps {
  params: Promise<{ id: string }>;
}

export default async function AddResourcePage({ params }: AddResourcePageProps) {
  const session = await auth();
  if (!session) return null;

  const { id } = await params;

  // Get project with access verification
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          owner: true,
          organisation: {
            include: {
              members: true
            }
          },
          members: {
            include: {
              user: true
            }
          }
        },
      },
      resources: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
        }
      }
    },
  });

  if (!project) {
    notFound();
  }

  // Check if user has access to this project
  const hasAccess = project.team.members.some(
    member => member.userId === session.user.id
  ) || (
    project.team.organisation &&
    (project.team.organisation.members?.some(
      member => member.userId === session.user.id
    ) || project.team.organisation.ownerId === session.user.id)
  );

  if (!hasAccess) {
    notFound();
  }

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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/main/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              <RiArrowLeftLine className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add Resource to {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Create a new resource that will be automatically assigned to this project
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusBadgeVariant(project.status)}>
              {project.status}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(project.priority)}>
              {project.priority}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content - Resource Creation Form */}
        <div className="xl:col-span-3">
          <Card>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                  <RiAddLine className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create New Resource
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Configure your new resource for this project
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <CreateResourceForm
                currentUserId={session.user.id}
                projectId={project.id}
                projectName={project.name}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar - Project Overview & Existing Resources */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                <RiProjectorLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Overview
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Team:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {project.team.name}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Organisation:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {project.team.organisation?.name || 'Personal Team'}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Progress:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {project.progress}%
                </span>
              </div>

              {project.description && (
                <div>
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                    {project.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Existing Resources */}
          {project.resources.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <RiServerLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Existing Resources
                </h2>
              </div>

              <div className="space-y-2">
                {project.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center min-w-0">
                      <RiServerLine className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {resource.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {resource.type}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}