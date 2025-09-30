import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { RiTeamLine } from '@remixicon/react';
import Link from 'next/link';
import CreateTeamForm from '@/components/form/CreateTeamForm';
import { notFound } from 'next/navigation';

interface CreateTeamPageProps {
  params: Promise<{ orgName: string }>;
}

export default async function CreateTeamPage({ params }: CreateTeamPageProps) {
  const { orgName } = await params;
  const session = await auth();
  if (!session) return null;

  // Get organisation by name
  const orgLookup = await prisma.organisation.findUnique({
    where: { name: orgName },
    select: { id: true }
  });
  if (!orgLookup) notFound();
  const organisationId = orgLookup.id;

  // Get the specific organisation
  const organisation = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      members: {
        where: { userId: session.user.id }
      }
    }
  });

  // Check if user is a member or owner
  const isMember = organisation?.members.length ?? 0 > 0;
  const isOwner = organisation?.ownerId === session.user.id;

  if (!organisation || (!isMember && !isOwner)) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs />
        </div>

        <Card className="p-8 text-center">
          <RiTeamLine className="w-16 h-16 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            You need to be a member of this organisation to create teams.
          </p>
          <Link href="/main/organisations">
            <Button>
              View Organisations
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Team
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Create a team to collaborate on projects within your organisation
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card className="p-6">
          <CreateTeamForm
            organisations={[organisation]}
            currentUserId={session.user.id}
            organisationId={organisationId}
            orgName={orgName}
          />
        </Card>
      </div>
    </div>
  );
}