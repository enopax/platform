import { auth } from '@/lib/auth';
import NewOrganisationForm from './NewOrganisationForm';
import Link from 'next/link';
import { RiArrowLeftLine } from '@remixicon/react';

export default async function NewOrganisationPage() {
  const session = await auth();
  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <Link href="/main/organisations" className="inline-flex items-center text-brand-600 dark:text-brand-400 hover:text-brand-700 mb-4">
          <RiArrowLeftLine className="mr-2 h-4 w-4" />
          Back to Organisations
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Organisation
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Set up a new organisation to collaborate with your team on IPFS storage projects.
        </p>
      </div>

      <NewOrganisationForm userId={session.user.id} />
    </div>
  );
}