import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import Table from '@/components/GenericTable';
import { columns } from '@/components/table/Project';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ProjectAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>,
}) {
  const size = 20;
  const { page = '1' } = await searchParams;
  const pageNumber = Number(page);

  const count = await prisma.project.count();

  const projectsRaw = await prisma.project.findMany({
    include: {
      team: {
        include: {
          owner: true,
          organisation: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (pageNumber - 1) * size,
    take: size,
  });

  // Convert Decimal to string for client components
  const projects = projectsRaw.map(project => ({
    ...project,
    budget: project.budget?.toString() || null,
  }));

  return (
    <main className="mt-4">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Headline>All Projects</Headline>
          <Link href="/admin/project/new">
            <Button>Add Project</Button>
          </Link>
        </div>

        {count ? (
          <Table
            pageNumber={pageNumber}
            tableSize={count}
            tableData={projects}
            tableColumns={columns}
          />
        ): (
          <p className="my-20">
            No projects available
          </p>
        )}
      </Container>
    </main>
  );
}