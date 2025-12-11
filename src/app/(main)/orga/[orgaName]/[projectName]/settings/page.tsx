import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProjectSettingsClient from './ProjectSettingsClient';

interface ProjectSettingsPageProps {
  params: Promise<{ orgaName: string; projectName: string }>;
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const session = await auth();

  if (!session) {
    notFound();
  }

  const { orgaName, projectName } = await params;

  // Validate that parameters are provided
  if (!orgaName || !projectName) {
    notFound();
  }

  // Get teams where the user is a member (they can edit projects in their teams)
  const userTeams = await prisma.team.findMany({
    where: {
      OR: [
        // Teams they own
        { ownerId: session.user.id },
        // Teams they're a member of
        {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      ],
    },
    include: {
      owner: true,
      organisation: true,
    },
    orderBy: { name: 'asc' },
  });

  return <ProjectSettingsClient userTeams={userTeams} currentUserId={session.user.id} />;
}
