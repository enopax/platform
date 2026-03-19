import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { getStoreAsync } from '@/lib/store';
import Link from 'next/link';
import ProjectForm from '@/components/form/ProjectForm';
import { createProject, type CreateProjectState } from '@/actions/project';

export default async function NewProjectPage() {
  const store = await getStoreAsync();
  const allOrgs = await store.organisations.search('', 10000);
  const organisations = allOrgs
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(org => ({ id: org.id, name: org.name }));

  return (
    <main className="mt-4">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Headline>Create New Project</Headline>
          <Link href="/admin/project">
            <Button variant="light">Back to Projects</Button>
          </Link>
        </div>

        <Card>
          <ProjectForm 
            organisations={organisations} 
          />
        </Card>
      </Container>
    </main>
  );
}