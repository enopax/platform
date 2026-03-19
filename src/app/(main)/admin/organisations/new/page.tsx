import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { getStoreAsync } from '@/lib/store';
import Link from 'next/link';
import OrganisationForm from '@/components/form/OrganisationForm';

export default async function NewOrganisationPage() {
  const store = await getStoreAsync();
  const users = await store.users.findMany();

  return (
    <main className="mt-4">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Headline>Create New Organisation</Headline>
          <Link href="/admin/organisations">
            <Button variant="light">Back to Organisations</Button>
          </Link>
        </div>

        <Card>
          <OrganisationForm />
        </Card>
      </Container>
    </main>
  );
}