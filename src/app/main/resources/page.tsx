import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import Table from '@/components/GenericTable';
import { columns as resourceColumns } from '@/components/table/Resource';
import {
  RiAddLine,
  RiServerLine,
  RiDatabase2Line,
  RiCloudLine,
  RiCodeLine
} from '@remixicon/react';
import Link from 'next/link';

// Function to get resource-specific metrics from database
async function getResourceMetrics(userId: string) {
  try {
    // Get user's storage resources and their usage from database
    const storageResources = await prisma.resource.findMany({
      where: {
        OR: [
          { ownerId: userId, type: 'STORAGE', isActive: true },
          {
            team: {
              OR: [
                {
                  members: {
                    some: { userId }
                  }
                },
                { ownerId: userId }
              ]
            },
            type: 'STORAGE',
            isActive: true,
          }
        ]
      },
      select: {
        id: true,
        name: true,
        quotaLimit: true,
        currentUsage: true,
        configuration: true,
      }
    });

    return {
      storageResources,
    };
  } catch (error) {
    console.error('Error fetching resource metrics:', error);
    return {
      storageResources: [],
    };
  }
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>,
}) {
  const size = 20;
  const { page = '1' } = await searchParams;
  const pageNumber = Number(page);
  const session = await auth();
  if (!session) return null;

  // Get resource metrics from database
  const resourceMetrics = await getResourceMetrics(session.user.id);

  // Get resources that the user owns or can access through teams
  const userResources = await prisma.resource.findMany({
    where: {
      OR: [
        // Resources owned by the user
        {
          ownerId: session.user.id,
          isActive: true,
        },
        // Resources managed by teams the user is a member of
        {
          team: {
            OR: [
              // Teams where user is a member
              {
                members: {
                  some: {
                    userId: session.user.id
                  }
                }
              },
              // Teams where user is the owner
              {
                ownerId: session.user.id
              }
            ]
          },
          isActive: true,
        },
        // Public resources (if any in the organisation)
        {
          isPublic: true,
          isActive: true,
        }
      ]
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          firstname: true,
          lastname: true,
          email: true,
        }
      },
      team: {
        select: {
          id: true,
          name: true,
          organisationId: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip: (pageNumber - 1) * size,
    take: size,
  });

  // Enhance resources with database metrics for STORAGE type resources
  const resourcesWithMetrics = userResources.map(resource => {
    if (resource.type === 'STORAGE') {
      const storageResource = resourceMetrics.storageResources.find(sr => sr.id === resource.id);
      if (storageResource) {
        const totalSize = Number(storageResource.quotaLimit || 0);
        const usedSize = Number(storageResource.currentUsage || 0);
        const availableSize = Math.max(0, totalSize - usedSize);

        return {
          ...resource,
          storageMetrics: {
            totalSize,
            usedSize,
            availableSize,
          },
        };
      }
    }
    return {
      ...resource,
      storageMetrics: null,
    };
  });

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Resources
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your computing resources and infrastructure
            </p>
          </div>
          <Link href="/main/resources/new">
            <Button className="w-full sm:w-auto">
              <RiAddLine className="mr-2 h-4 w-4" />
              Create Resource
            </Button>
          </Link>
        </div>
      </div>

      {/* Resources Table Section */}
      {resourcesWithMetrics.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            My Resources ({resourcesWithMetrics.length})
          </h2>
          <Card className="overflow-hidden">
            <Table
              pageNumber={pageNumber}
              tableSize={resourcesWithMetrics.length}
              tableData={resourcesWithMetrics}
              tableColumns={resourceColumns}
              tableMeta={{ currentUserId: session.user.id }}
            />
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <RiServerLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No resources yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by creating your first resource to manage your infrastructure.
          </p>
          <Link href="/main/resources/new">
            <Button>
              <RiAddLine className="mr-2 h-4 w-4" />
              Create Resource
            </Button>
          </Link>
        </Card>
      )}

      {/* Quick Actions Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Link href="/main/resources/new" className="group">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer">
              <RiServerLine className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Create Resource</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a new computing resource to your infrastructure
              </p>
            </div>
          </Link>

          <Link href="/main/teams" className="group">
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-400 dark:hover:border-brand-500 transition-colors cursor-pointer">
              <RiDatabase2Line className="h-6 w-6 text-gray-400 group-hover:text-brand-500 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Team Resources</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage resources shared with your teams
              </p>
            </div>
          </Link>

          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg opacity-50">
            <RiCloudLine className="h-6 w-6 text-gray-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white">Resource Monitoring</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor resource usage and performance (Coming Soon)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}