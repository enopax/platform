import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
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
  params: Promise<{ slug: string }>;
}

export default async function OrganisationSettingsPage({ params }: OrganisationSettingsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const { slug } = await params;

  // Validate that slug is provided
  if (!slug) {
    notFound();
  }

  // Get organisation by name
  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(slug);
  if (!organisation) notFound();
  const organisationId = organisation.id;

  // Check if user is a member of this organisation
  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);

  const isAdmin = session.user.role === 'SUPERADMIN';
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

  // Fetch counts needed for display
  const orgMembers = await store.organisationMembers.findByOrgId(organisationId);
  const organisationCounts = {
    _count: {
      members: orgMembers.length,
      joinRequests: 0,
    }
  };

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
              Manage settings and configuration for {slug}
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
                organisationName={slug}
                redirectUrl={`/${slug}`}
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
                      Resource Limits
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Set limits for resource usage across the organisation
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
              <Link href={`/${slug}`} className="block">
                <Button variant="light" className="w-full justify-start text-sm px-3 py-2">
                  <RiUserLine className="mr-2 h-4 w-4" />
                  View Organisation
                </Button>
              </Link>
              <Link href={`/${slug}/members`} className="block">
                <Button variant="light" className="w-full justify-start text-sm px-3 py-2">
                  <RiUserLine className="mr-2 h-4 w-4" />
                  Manage Members
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function OrganisationSettingsFormWrapper({
  organisationId,
  organisationName,
  redirectUrl
}: {
  organisationId: string;
  organisationName: string;
  redirectUrl: string;
}) {
  const store = await getStoreAsync();
  const organisation = await store.organisations.findById(organisationId);

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