import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import OrganisationSettingsForm from '@/components/form/OrganisationSettingsForm';
import { OrganisationSettingsOverviewClient } from '@/components/OrganisationSettingsOverviewClient';
import {
  RiArrowLeftLine,
  RiSettingsLine,
  RiUserLine,
  RiTeamLine,
} from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface OrganisationSettingsPageProps {
  params: Promise<{ orgaName: string }>;
}

export default async function OrganisationSettingsPage({ params }: OrganisationSettingsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const { orgaName } = await params;

  // Validate that orgaName is provided
  if (!orgaName) {
    notFound();
  }

  // Get organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name: orgaName },
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

  // Fetch the organisation with only counts needed for display
  const organisationCounts = await prisma.organisation.findUnique({
    where: {
      id: organisationId,
      isActive: true
    },
    select: {
      _count: {
        select: {
          members: true,
          joinRequests: true
        }
      }
    }
  });

  if (!organisationCounts) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
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
              Manage settings and configuration for {orgaName}
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
                  <RiSettingsLine className="w-5 h-5 text-brand-600 dark:text-brand-400" />
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
              <OrganisationSettingsFormWrapper
                organisationId={organisationId}
                organisationName={orgaName}
                redirectUrl={`/orga/${orgaName}`}
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
          <OrganisationSettingsOverviewClient
            memberCount={organisationCounts._count.members}
            pendingRequests={organisationCounts._count.joinRequests}
          />

          {/* Navigation */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link href={`/orga/${orgaName}`} className="block">
                <Button variant="light" className="w-full justify-start text-sm px-3 py-2">
                  <RiUserLine className="mr-2 h-4 w-4" />
                  View Organisation
                </Button>
              </Link>
              <Link href={`/orga/${orgaName}/members`} className="block">
                <Button variant="light" className="w-full justify-start text-sm px-3 py-2">
                  <RiUserLine className="mr-2 h-4 w-4" />
                  Manage Members
                </Button>
              </Link>
              <Link href={`/orga/${orgaName}/teams`} className="block">
                <Button variant="light" className="w-full justify-start text-sm px-3 py-2">
                  <RiTeamLine className="mr-2 h-4 w-4" />
                  Manage Teams
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Client component wrapper to fetch and pass organisation data to the form
async function OrganisationSettingsFormWrapper({
  organisationId,
  organisationName,
  redirectUrl
}: {
  organisationId: string;
  organisationName: string;
  redirectUrl: string;
}) {
  const organisation = await prisma.organisation.findUnique({
    where: { id: organisationId }
  });

  if (!organisation) {
    notFound();
  }

  return (
    <OrganisationSettingsForm
      organisation={organisation}
      redirectUrl={redirectUrl}
    />
  );
}