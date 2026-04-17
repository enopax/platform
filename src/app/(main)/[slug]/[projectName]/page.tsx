import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import ProjectDetailsClient from '@/components/ProjectDetailsClient';

interface ProjectDetailsPageProps {
  params: Promise<{ slug: string; projectName: string }>;
}

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const session = await auth();

  if (!session) {
    notFound();
  }

  const { slug, projectName } = await params;

  // Validate that parameters are provided
  if (!slug || !projectName) {
    notFound();
  }

  // Permission checks and data loading happen in layouts via context
  // This page just validates the session and renders the client component
  return <ProjectDetailsClient />;
}
