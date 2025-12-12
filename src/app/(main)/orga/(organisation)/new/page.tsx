import { auth } from '@/lib/auth';
import NewOrganisationForm from './NewOrganisationForm';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export default async function NewOrganisationPage() {
  const session = await auth();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs />
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Organisation
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Set up a new organisation to collaborate with your team on IPFS storage projects.
        </p>
      </div>

      <div className="max-w-2xl">
        <NewOrganisationForm userId={session.user.id} />
      </div>
    </div>
  );
}