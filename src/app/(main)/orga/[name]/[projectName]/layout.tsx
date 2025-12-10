import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProjectProvider } from '@/contexts/ProjectContext';

export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ name: string; projectName: string }>;
}>) {
  const { name, projectName } = await params;

  // Validate that parameters are provided
  if (!name || !projectName) {
    notFound();
  }

  // Fetch the organisation by name
  const organisation = await prisma.organisation.findUnique({
    where: { name },
    select: { id: true },
  });

  if (!organisation) {
    notFound();
  }

  // Fetch the project by name and organisation
  const project = await prisma.project.findFirst({
    where: {
      name: projectName,
      organisationId: organisation.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      organisationId: true,
      isActive: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <ProjectProvider project={project}>
      {children}
    </ProjectProvider>
  );
}
