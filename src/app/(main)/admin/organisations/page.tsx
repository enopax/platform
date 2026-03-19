import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import Table from '@/components/GenericTable';
import { columns } from '@/components/table/Organisation';
import { getStoreAsync } from '@/lib/store';
import Link from 'next/link';

export default async function OrganisationAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>,
}) {
  const size = 20;
  const { page = '1' } = await searchParams;
  const pageNumber = Number(page);

  const store = await getStoreAsync();
  const allOrgs = await store.organisations.search('', 10000);

  const count = allOrgs.length;

  const sortedOrgs = allOrgs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const pagedOrgs = sortedOrgs.slice((pageNumber - 1) * size, pageNumber * size);

  const organisations = await Promise.all(
    pagedOrgs.map(async (org) => {
      const owner = await store.users.findById(org.ownerId);
      const members = await store.organisationMembers.findByOrgId(org.id);
      return {
        ...org,
        owner: owner ?? null,
        _count: {
          members: members.length,
        },
      };
    })
  );

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