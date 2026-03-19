import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import Table from '@/components/GenericTable';
import { columns } from '@/components/table/Project';
import { getStoreAsync } from '@/lib/store';
import Link from 'next/link';

export default async function ProjectAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>,
}) {
  const size = 20;
  const { page = '1' } = await searchParams;
  const pageNumber = Number(page);

  const store = await getStoreAsync();
  const allProjects = await store.projects.search('', 10000);
  const count = allProjects.length;

  const sorted = allProjects.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const projectsRaw = sorted.slice((pageNumber - 1) * size, pageNumber * size);

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