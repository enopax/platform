import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import Link from 'next/link';
import {
  RiArrowRightLine,
  RiHomeLine,
  RiServerLine,
  RiDatabaseLine,
  RiHardDriveLine,
  RiGlobalLine,
  RiCodeLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteBinLine,
  RiLinksLine,
  RiSettings4Line,
  RiInformationLine
} from '@remixicon/react';

interface ResourceDetailPageProps {
  params: Promise<{ orgName: string; resourceId: string }>;
}

const RESOURCE_TYPE_CONFIG = {
  COMPUTE: { icon: RiServerLine, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  STORAGE: { icon: RiHardDriveLine, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  NETWORK: { icon: RiGlobalLine, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  DATABASE: { icon: RiDatabaseLine, color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  API: { icon: RiCodeLine, color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-900/20' },
  OTHER: { icon: RiMoreLine, color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900/20' }
} as const;

const STATUS_CONFIG = {
  PROVISIONING: { variant: 'warning' as const, label: 'Provisioning' },
  ACTIVE: { variant: 'success' as const, label: 'Active' },
  INACTIVE: { variant: 'outline' as const, label: 'Inactive' },
  MAINTENANCE: { variant: 'warning' as const, label: 'Maintenance' },
  DELETED: { variant: 'outline' as const, label: 'Deleted' }
} as const;

function formatBytes(bytes: bigint | number): string {
  const num = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (num === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { orgName, resourceId } = await params;
  const session = await auth();
  if (!session) return null;

  // Get organisation
  const organisation = await prisma.organisation.findUnique({
    where: { name: orgName },
    select: { id: true, name: true }
  });
  if (!organisation) notFound();

  // Check membership
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: organisation.id
      }
    }
  });

  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';
  const isMember = !!membership;

  if (!isMember && !isAdmin) {
    notFound();
  }

  const canManage = isOwner || isManager || isAdmin;

  // Fetch resource with allocations
  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      organisationId: organisation.id,
      isActive: true
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      allocatedProjects: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      }
    }
  });

  if (!resource) notFound();

  const typeConfig = RESOURCE_TYPE_CONFIG[resource.type];
  const statusConfig = STATUS_CONFIG[resource.status];
  const Icon = typeConfig.icon;
  const usagePercentage = resource.quotaLimit
    ? Math.min(Math.round((Number(resource.currentUsage) / Number(resource.quotaLimit)) * 100), 100)
    : 0;

  return (
    <main className="mt-4">
      <Container>
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link href="/main" className="hover:text-gray-900 dark:hover:text-gray-100 flex items-center">
            <RiHomeLine className="h-4 w-4 mr-1" />
            Main
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <Link href="/main/organisations" className="hover:text-gray-900 dark:hover:text-gray-100">
            Organisations
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <Link href={`/main/organisations/${orgName}`} className="hover:text-gray-900 dark:hover:text-gray-100">
            {organisation.name}
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <Link href={`/main/organisations/${orgName}/resources`} className="hover:text-gray-900 dark:hover:text-gray-100">
            Resources
          </Link>
          <RiArrowRightLine className="h-3 w-3" />
          <span className="text-gray-900 dark:text-gray-100 font-medium">{resource.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-lg ${typeConfig.bgColor}`}>
              <Icon className={`h-8 w-8 ${typeConfig.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {resource.name}
                </h1>
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
                {resource.isPublic && (
                  <Badge variant="outline">Public</Badge>
                )}
              </div>
              {resource.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {resource.description}
                </p>
              )}
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <RiSettings4Line className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resource Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <RiInformationLine className="h-5 w-5" />
                Resource Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Type</label>
                  <p className="text-gray-900 dark:text-white font-medium">{resource.type}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                  <p className="text-gray-900 dark:text-white font-medium">{resource.status}</p>
                </div>
                {resource.endpoint && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500 dark:text-gray-400">Endpoint</label>
                    <p className="text-gray-900 dark:text-white font-mono text-sm break-all">
                      {resource.endpoint}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Created</label>
                  <p className="text-gray-900 dark:text-white">
                    {resource.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Owner</label>
                  <p className="text-gray-900 dark:text-white">{resource.owner.name || resource.owner.email}</p>
                </div>
              </div>

              {/* Usage Information */}
              {resource.quotaLimit && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">Usage</label>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-900 dark:text-white">
                      {formatBytes(resource.currentUsage)} / {formatBytes(resource.quotaLimit)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {usagePercentage}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        usagePercentage >= 90
                          ? 'bg-red-500'
                          : usagePercentage >= 75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              {resource.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Allocated Projects */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <RiLinksLine className="h-5 w-5" />
                  Allocated to Projects ({resource.allocatedProjects.length})
                </h2>
                {canManage && (
                  <Button variant="outline" size="sm">
                    Allocate to Project
                  </Button>
                )}
              </div>

              {resource.allocatedProjects.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                  This resource is not allocated to any projects yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {resource.allocatedProjects.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colours"
                    >
                      <Link
                        href={`/main/organisations/${orgName}/projects/${allocation.project.id}`}
                        className="block"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400">
                          {allocation.project.name}
                        </h3>
                        {allocation.project.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {allocation.project.description}
                          </p>
                        )}
                        {allocation.quotaLimit && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Quota: {formatBytes(allocation.quotaLimit)}
                          </p>
                        )}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {canManage && (
              <Card className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <RiEditLine className="mr-2 h-4 w-4" />
                    Edit Resource
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <RiLinksLine className="mr-2 h-4 w-4" />
                    Allocate to Project
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" size="sm">
                    <RiDeleteBinLine className="mr-2 h-4 w-4" />
                    Delete Resource
                  </Button>
                </div>
              </Card>
            )}

            {/* Configuration */}
            {resource.configuration && typeof resource.configuration === 'object' && (
              <Card className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Configuration</h3>
                <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono overflow-auto max-h-64">
                  {JSON.stringify(resource.configuration, null, 2)}
                </pre>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}