import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { RiProjectorLine } from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProjectForm from '@/components/form/ProjectForm';
import { teamService } from '@/lib/services/team';

interface CreateProjectPageProps {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ team?: string }>;
}

export default async function CreateProjectPage({ params, searchParams }: CreateProjectPageProps) {
  const { name } = await params;

  // Validate that name is provided
  if (!name) {
    notFound();
  }

  const { team: preselectedTeamId } = await searchParams;
  const session = await auth();

  // Get organisation by name
  const orgLookup = await prisma.organisation.findUnique({
    where: { name },
    select: { id: true, name: true }
  });
  if (!orgLookup) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Organisation Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The organisation you're looking for doesn't exist.
        </p>
        <Link href="/orga/organisations">
          <Button>View Organisations</Button>
        </Link>
      </div>
    );
  }
  const organisationId = orgLookup.id;

  // Verify user has access to this organisation
  const isAdmin = session.user.role === 'ADMIN';
  const membership = isAdmin ? true : await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId
      }
    }
  });

  if (!membership) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have access to this organisation.
        </p>
        <Link href="/main/select-organisation">
          <Button>Select Organisation</Button>
        </Link>
      </div>
    );
  }

  // Get teams in this organisation
  const organisationTeams = await prisma.team.findMany({
    where: {
      organisationId: organisationId,
      isActive: true
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          firstname: true,
          lastname: true
        }
      },
      organisation: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      { teamType: 'asc' },
      { name: 'asc' }
    ]
  });

  // Get organisation details
  const organisation = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: {
      id: true,
      name: true
    }
  });


  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Project
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Create a project in {organisation?.name}. You can assign teams and resources later.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <Card>
          <ProjectForm
            teams={organisationTeams}
            redirectUrl={`/orga/${name}`}
            currentUserId={session.user.id}
            preselectedTeamId={preselectedTeamId}
            organisationId={organisationId}
          />
        </Card>
      </div>
    </div>
  );
}
