import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import ProjectSettingsClient from './ProjectSettingsClient';

interface ProjectSettingsPageProps {
  params: Promise<{ slug: string; projectName: string }>;
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const session = await auth();

  if (!session) {
    notFound();
  }

  const { slug, projectName } = await params;

  // Validate that parameters are provided
  if (!slug || !projectName) {
    notFound();
  }

  return <ProjectSettingsClient currentUserId={session.user.id} />;
}
