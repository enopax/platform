import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { OrganisationProvider } from '@/contexts/OrganisationContext';

export default async function OrganisationLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ name: string }>;
}>) {
  const { name } = await params;

  // Validate that name is provided
  if (!name) {
    notFound();
  }

  // Fetch the organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      isActive: true,
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
