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

  return <ProjectSettingsClient currentUserId={session.user.id} />;
}
