import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrganisationsClient } from '@/components/OrganisationsClient';
import { redirect } from 'next/navigation';

export default async function OrganisationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/auth/signin');
  }

  const isAdmin = session.user.role === 'ADMIN';

  // Fetch user's organisations
  const organisations = await prisma.organisation.findMany({
    where: {
      isActive: true,
      ...(isAdmin
        ? {}
        : {
            members: {
              some: {
                userId: session.user.id
              }
            }
          })
    },
    include: {
      owner: {
        select: {
          name: true,
          firstname: true,
          lastname: true,
          email: true
        }
      },
      _count: {
        select: {
          projects: true,
          members: true,
          resources: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return <OrganisationsClient organisations={organisations} />;
}
