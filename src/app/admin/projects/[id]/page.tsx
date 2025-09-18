import { notFound } from 'next/navigation';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ProjectForm from '@/components/form/ProjectForm';
import { updateProject, type UpdateProjectState } from '@/actions/project';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;

  const [projectRaw, organisations] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            owner: true,
            organisation: true,
          },
        },
        organisation: true,
      },
    }),
    prisma.organisation.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  if (!projectRaw) {
    notFound();
  }

  // Convert Decimal to string for client components
  const project = {
    ...projectRaw,
    budget: projectRaw.budget?.toString() || null,
  };

  return (
    <main className="mt-4">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Headline>Edit Project</Headline>
          <Link href="/admin/project">
            <Button variant="light">Back to Projects</Button>
          </Link>
        </div>

        <Card>
          <ProjectForm 
            project={project}
            organisations={organisations} 
          />
        </Card>
      </Container>
    </main>
  );
}