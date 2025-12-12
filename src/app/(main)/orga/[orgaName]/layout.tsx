import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { OrganisationProvider } from '@/contexts/OrganisationContext';

export default async function OrganisationLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ orgaName: string }>;
}>) {
  const { orgaName } = await params;

  // Validate that orgaName is provided
  if (!orgaName) {
    notFound();
  }

  // Fetch the organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name: orgaName },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      isActive: true,
      projects: {
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          progress: true,
          createdAt: true,
          allocatedResources: {
            include: {
              resource: {
                select: {
                  id: true,
                  type: true,
                  status: true,
                  currentUsage: true,
                  quotaLimit: true,
                },
              },
            },
            where: {
              resource: {
                isActive: true,
                status: 'ACTIVE',
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      },
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  });

  if (!organisation || !organisation.isActive) {
    notFound();
  }

  return (
    <OrganisationProvider organisation={organisation}>
      {children}
    </OrganisationProvider>
  );
}
