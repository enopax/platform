import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { RiServerLine } from '@remixicon/react';
import CreateResourceForm from '@/components/form/CreateResourceForm';
import Link from 'next/link';

interface CreateResourcePageProps {
  params: Promise<{ id: string }>;
}

export default async function CreateResourcePage({ params }: CreateResourcePageProps) {
  const { id: organisationId } = await params;
  const session = await auth();
  if (!session) return null;

  // Verify user has access to this organisation
  const isAdmin = session.user.role === 'ADMIN';
  const membership = isAdmin ? true : await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId: session.user.id,
        organisationId: organisationId
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
      organisation: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      { teamType: 'asc' }, // Admin teams first
      { name: 'asc' }
    ]
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Purchase New Resource
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Acquire and configure a new resource for your projects
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card className="p-6">
          <CreateResourceForm
            currentUserId={session.user.id}
            teams={organisationTeams}
          />
        </Card>
      </div>
    </div>
  );
}