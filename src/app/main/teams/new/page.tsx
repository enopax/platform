import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { RiTeamLine } from '@remixicon/react';
import Link from 'next/link';
import CreateTeamForm from '@/components/form/CreateTeamForm';

export default async function CreateTeamPage() {
  const session = await auth();
  if (!session) return null;

  // Get organisations where the user is a member (they can create teams in their orgs)
  const userOrganisations = await prisma.organisation.findMany({
    where: {
      OR: [
        // Organisations they own
        { ownerId: session.user.id },
        // Organisations they're a member of
        {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      ]
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: { name: 'asc' }
  });

  if (userOrganisations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs />
        </div>

        <Card className="p-8 text-center">
          <RiTeamLine className="w-16 h-16 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Organisations Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            You need to be a member of an organisation to create teams. 
            Please join an organisation first or ask an admin to add you to one.
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
            organisations={userOrganisations}
            currentUserId={session.user.id}
          />
        </Card>
      </div>
    </div>
  );
}