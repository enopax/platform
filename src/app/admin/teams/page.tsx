import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import Table from '@/components/GenericTable';
import { columns } from '@/components/table/Team';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function TeamAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>,
}) {
  const size = 20;
  const { page = '1' } = await searchParams;
  const pageNumber = Number(page);

  const count = await prisma.team.count();

  const teams = await prisma.team.findMany({
    include: {
      owner: true,
      organisation: true,
      _count: {
        select: {
          members: true,
          projects: true,
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
          <Headline>All Teams</Headline>
          <Link href="/admin/team/new">
            <Button>Add Team</Button>
          </Link>
        </div>

        {count ? (
          <Table
            pageNumber={pageNumber}
            tableSize={count}
            tableData={teams}
            tableColumns={columns}
          />
        ): (
          <p className="my-20">
            No teams available
          </p>
        )}
      </Container>
    </main>
  );
}