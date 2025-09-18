import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import BackButton from '@/components/common/BackButton';
import MagicLinkForm from '@/components/form/MagicLinkForm';

export default async function Page() {
  return (
    <main className="min-h-[80vh] flex items-center">
      <Card className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="text-center">
          <h2 className="mt-4 mb-8 text-2xl font-extrabold text-gray-900 dark:text-gray-300">
            Sign In
          </h2>
        </div>

        <MagicLinkForm />

      </Card>
    </main>
  );
}
