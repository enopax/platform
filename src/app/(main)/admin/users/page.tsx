import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Divider } from '@/components/common/Divider';
import { Intro } from '@/components/Intro';
import Table from '@/components/GenericTable';
import { columns } from '@/components/table/User';
import { prisma } from '@/lib/prisma';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>,
}) {
  const size = 20;
  const { page = '1' } = await searchParams;
  const pageNumber = Number(page);

  const count = await prisma.user.count();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    skip: (pageNumber - 1) * size,
    take: size,
  });

  return (
    <main className="mt-4">
      <Container>
        <Headline>All Users</Headline>

        {count ? (
          <Table
            pageNumber={pageNumber}
            tableSize={count}
            tableData={users}
            tableColumns={columns}
          />
        ): (
          <p className="my-20">
            No users available
          </p>
        )}
      </Container>
    </main>
  );
}
