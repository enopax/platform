import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import Table from '@/components/GenericTable';
import { columns } from '@/components/table/Organisation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function OrganisationAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>,
}) {
  const size = 20;
  const { page = '1' } = await searchParams;
  const pageNumber = Number(page);

  const count = await prisma.organisation.count();

  const organisations = await prisma.organisation.findMany({
    include: {
      owner: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (pageNumber - 1) * size,
    take: size,
  });

  return (
    <main className="mt-4">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Headline>All Organisations</Headline>
          <Link href="/admin/organisations/new">
            <Button>Add Organisation</Button>
          </Link>
        </div>

        {count ? (
          <Table
            pageNumber={pageNumber}
            tableSize={count}
            tableData={organisations}
            tableColumns={columns}
          />
        ): (
          <p className="my-20">
            No organisations available
          </p>
        )}
      </Container>
    </main>
  );
}