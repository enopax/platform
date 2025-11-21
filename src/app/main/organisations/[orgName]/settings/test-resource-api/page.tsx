import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
  if (!session) return null;

  const { orgName } = await params;

  const organisation = await prisma.organisation.findUnique({
    where: { name: orgName },
    select: {
      id: true,
      name: true,
    }
  });

  if (!organisation) notFound();

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
  const canAccess = isAdmin || isOwner;

  if (!canAccess) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center">
          <p className="text-gray-600">You do not have permission to access this page.</p>
          <p className="text-sm text-gray-500 mt-2">Only organisation owners can test Resource API integration.</p>
        </Card>
      </div>
    );
  }

  const projects = await prisma.project.findMany({
    where: { organisationId: organisation.id },
    select: {
      id: true,
      name: true,
    },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/main/organisations/${orgName}/settings`}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RiArrowLeftLine className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-semibold text-gray-900">
              Resource API Test
            </h1>
          </div>
          <p className="text-gray-600">
            Test connectivity and integration with the Resource API
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About Resource API Testing</h2>
          <p className="text-sm text-gray-600">
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
