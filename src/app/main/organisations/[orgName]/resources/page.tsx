import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Container from '@/components/common/Container';
import { Button } from '@/components/common/Button';
import Link from 'next/link';
import {
  RiAddLine,
  RiArrowRightLine,
  RiHomeLine
} from '@remixicon/react';
import OrganisationResources from '@/components/table/OrganisationResources';

interface OrganisationResourcesPageProps {
  params: Promise<{ orgName: string }>;
}

export default async function OrganisationResourcesPage({ params }: OrganisationResourcesPageProps) {
  const { orgName } = await params;
  const session = await auth();
  if (!session) return null;

  // Get organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name: orgName },
    select: { id: true, name: true }
  });
  if (!organisation) notFound();
  const organisationId = organisation.id;

  // Check if user is admin
  const isAdmin = session.user.role === 'ADMIN';

  // Check if user is a member of this organisation
  const membership = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId
      }
    }
  });

  const isOwner = membership?.role === 'OWNER';
  const isManager = membership?.role === 'MANAGER';
  const isMember = !!membership;

  // Anyone can view the page, but need to be a member or admin to see details
  if (!isMember && !isAdmin) {
    notFound();
  }

  // Only owners, managers, and admins can access management actions
  const canManage = isOwner || isManager || isAdmin;

  // Fetch organisation resources
  const resources = await prisma.resource.findMany({
    where: {
      organisationId,
      isActive: true
    },
    include: {
      _count: {
        select: {
          allocatedProjects: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

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
          <span className="text-gray-900 dark:text-gray-100 font-medium">Resources</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Resources
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage shared resources for {organisation.name}
            </p>
          </div>
          {canManage && (
            <Link href={`/main/organisations/${orgName}/resources/new`}>
              <Button>
                <RiAddLine className="mr-2 h-4 w-4" />
                Create Resource
              </Button>
            </Link>
          )}
        </div>

        {/* Resources List */}
        <OrganisationResources
          resources={resources}
          orgName={orgName}
          canManage={canManage}
        />
      </Container>
    </main>
  );
}