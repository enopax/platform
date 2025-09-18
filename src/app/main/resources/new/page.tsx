import { auth } from '@/lib/auth';
import { Card } from '@/components/common/Card';
import { RiServerLine } from '@remixicon/react';
import CreateResourceForm from '@/components/form/CreateResourceForm';

export default async function CreateResourcePage() {
  const session = await auth();
  if (!session) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Resource
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Add a new computing resource to your infrastructure
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card className="p-6">
          <CreateResourceForm currentUserId={session.user.id} />
        </Card>
      </div>
    </div>
  );
}