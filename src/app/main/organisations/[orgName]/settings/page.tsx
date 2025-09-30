import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import OrganisationSettingsForm from '@/components/form/OrganisationSettingsForm';
import {
  RiArrowLeftLine,
  RiBuildingLine,
  RiSettingsLine,
  RiUserLine,
  RiTeamLine,
  RiCalendarLine
} from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface OrganisationSettingsPageProps {
  params: Promise<{ orgName: string }>;
}

export default async function OrganisationSettingsPage({ params }: OrganisationSettingsPageProps) {
  const session = await auth();
  if (!session) return null;

  const { orgName } = await params;

  // Get organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name: orgName },
    select: { id: true, name: true }
  });
  if (!organisation) notFound();
  const organisationId = organisation.id;

  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId
      }
    }
  });

  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';
  const isMember = !!membership;

  // Check permissions
  if (!isMember && !isAdmin) {
    notFound();
  }

  // Only owners, managers, and admins can access settings
  const canManageSettings = isOwner || isManager || isAdmin;
  if (!canManageSettings) {
    notFound();
  }

  // Fetch the organisation with full details
  const organisationFull = await prisma.organisation.findUnique({
    where: {
      id: organisationId,
      isActive: true
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
      _count: {
        select: {
          members: true,
          teams: true,
          joinRequests: true
        }
      }
    }
  });

  if (!organisationFull) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/main/organisations/${orgName}`}>
            <Button variant="outline" size="sm">
              <RiArrowLeftLine className="mr-2 h-4 w-4" />
              Back to Organisation
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                <RiSettingsLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Organisation Settings
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Manage settings and configuration for {organisationFull.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {membership?.role || 'Admin'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content - Organisation Settings Form */}
        <div className="xl:col-span-3">
          <Card>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                  <RiBuildingLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Organisation Configuration
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Update organisation information and settings
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <OrganisationSettingsForm
                organisation={organisationFull}
                redirectUrl={`/main/organisations/${orgName}`}
              />
            </div>
          </Card>

          {/* Additional Settings */}
          <Card className="mt-6">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                  <RiSettingsLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Advanced Settings
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Additional configuration options
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Member Invitations
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Control who can invite new members to the organisation
                    </p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Team Management
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure team creation and management permissions
                    </p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Resource Limits
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set limits for resource usage across teams
                    </p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - Organisation Overview */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg mr-3">
                <RiBuildingLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Organisation Overview
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Owner:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {organisationFull.owner.name || organisationFull.owner.firstname || organisationFull.owner.email}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Members:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {organisationFull._count.members}
                </span>
              </div>

              <div>
                <span className="text-gray-500">Teams:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {organisationFull._count.teams}
                </span>
              </div>

              {organisationFull._count.joinRequests > 0 && (
                <div>
                  <span className="text-gray-500">Pending Requests:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {organisationFull._count.joinRequests}
                  </span>
                </div>
              )}

              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {new Date(organisationFull.createdAt).toLocaleDateString()}
                </span>
              </div>

              {organisationFull.description && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">Description:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                    {organisationFull.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Navigation */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href={`/main/organisations/${orgName}`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RiUserLine className="mr-2 h-4 w-4" />
                  View Members
                </Button>
              </Link>
              <Link href={`/main/organisations/${orgName}/members`} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RiUserLine className="mr-2 h-4 w-4" />
                  Manage Members
                </Button>
              </Link>
              <Link href="/main/organisations" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RiBuildingLine className="mr-2 h-4 w-4" />
                  All Organisations
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}