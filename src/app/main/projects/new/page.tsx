import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { RiArrowLeftLine, RiProjectorLine } from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProjectForm from '@/components/form/ProjectForm';

export default async function CreateProjectPage() {
  const session = await auth();
  if (!session) return null;

  // Get organizations where the user is a member (they can create projects in their orgs)
  const userOrganizations = await prisma.organisation.findMany({
    where: {
      OR: [
        // Organizations they own
        { ownerId: session.user.id },
        // Organizations they're a member of
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

  if (userOrganizations.length === 0) {
    return (
      <div>
        <Card className="p-8 text-center">
          <RiProjectorLine className="w-16 h-16 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Organizations Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            You need to be a member of an organization to create projects. 
            Please join an organization first or ask an admin to add you to one.
          </p>
          <Link href="/main/organisations">
            <Button>
              View Organizations
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Project
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Create a project and assign it to a team within your organization
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <Card>
          <ProjectForm 
            organisations={userOrganizations}
            redirectUrl="/main/projects"
          />
        </Card>
      </div>
    </div>
  );
}