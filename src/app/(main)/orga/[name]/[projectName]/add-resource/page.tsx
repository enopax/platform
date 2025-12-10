import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface AddResourcePageProps {
  params: Promise<{ name: string; projectName: string }>;
}

// Redirect to the resource creation page for this project
export default async function AddResourcePage({ params }: AddResourcePageProps) {
  const { name, projectName } = await params;

  // Validate that required parameters are provided
  if (!name || !projectName) {
    notFound();
  }

  // Get organisation
  const organisation = await prisma.organisation.findUnique({
    where: { name },
    select: { id: true }
  });

  if (!organisation) {
    notFound();
  }

  // Verify the project exists
  const project = await prisma.project.findFirst({
    where: {
      name: projectName,
      organisationId: organisation.id,
      isActive: true,
    },
    select: { id: true }
  });

  if (!project) {
    notFound();
  }

  // Redirect to resource creation page with project context
  redirect(`/orga/${name}/${projectName}/new`);
}