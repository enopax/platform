import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { RiArrowLeftLine } from '@remixicon/react';
import { Card } from '@/components/common/Card';
import ResourceApiTestPanel from '@/components/resource-api/ResourceApiTestPanel';

interface TestResourceApiPageProps {
  params: Promise<{ orgName: string }>;
}

export default async function TestResourceApiPage({ params }: TestResourceApiPageProps) {
  const session = await auth();

  const { orgName } = await params;

  if (!orgName) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgName);

  if (!organisation) notFound();

  const membership = await store.organisationMembers.findByUserAndOrg(session.user.id, organisation.id);

  const isAdmin = session.user.role === 'SUPERADMIN';
  const isOwner = membership?.role === 'OWNER';
  const canAccess = isAdmin || isOwner;

  if (!canAccess) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">You do not have permission to access this page.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Only organisation owners can test Resource API integration.</p>
        </Card>
      </div>
    );
  }

  const allProjects = await store.projects.findByOrgId(organisation.id);
  const projects = allProjects.slice(0, 10).map(p => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/orga/${orgName}/settings`}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <RiArrowLeftLine className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Resource API Test
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Test connectivity and integration with the Resource API
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About Resource API Testing</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This page allows you to test the connection between the Platform and the Resource API.
            You can discover available providers, provision test resources, check their status, and clean up test resources.
          </p>
        </div>

        <ResourceApiTestPanel
          organisationName={organisation.name}
          projects={projects}
          userId={session.user.id}
        />
      </Card>
    </div>
  );
}
