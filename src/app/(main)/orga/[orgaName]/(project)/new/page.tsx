import { auth } from '@/lib/auth';
import { getStoreAsync } from '@/lib/store';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { RiProjectorLine } from '@remixicon/react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProjectForm from '@/components/form/ProjectForm';

interface CreateProjectPageProps {
  params: Promise<{ orgaName: string }>;
}

export default async function CreateProjectPage({ params }: CreateProjectPageProps) {
  const { orgaName } = await params;

  if (!orgaName) {
    notFound();
  }

  const session = await auth();
  const store = await getStoreAsync();

  const orgLookup = await store.organisations.findByName(orgaName);
  if (!orgLookup) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Organisation Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The organisation you're looking for doesn't exist.
        </p>
        <Link href="/orga/organisations">
          <Button>View Organisations</Button>
        </Link>
      </div>
    );
  }
  const organisationId = orgLookup.id;

  const isAdmin = session.user.role === 'ADMIN';
  const membership = isAdmin ? true : await store.organisationMembers.findByUserAndOrg(session.user.id, organisationId);

  if (!membership) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You don't have access to this organisation.
        </p>
        <Link href="/main/select-organisation">
          <Button>Select Organisation</Button>
        </Link>
      </div>
    );
  }

  const organisation = orgLookup;


  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Project
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Create a project in {organisation?.name}. You can assign teams and resources later.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <Card>
          <ProjectForm
            redirectUrl={`/orga/${orgaName}`}
            currentUserId={session.user.id}
            organisationId={organisationId}
          />
        </Card>
      </div>
    </div>
  );
}
