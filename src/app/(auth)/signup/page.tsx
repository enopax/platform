import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import BackButton from '@/components/common/BackButton';
import SignUpForm from '@/components/form/SignUpForm';

export default async function Page() {
  return (
    <main className="min-h-[80vh] flex items-center">
      <Card className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="text-center">
          <h2 className="mt-4 mb-8 text-2xl font-extrabold text-gray-900 dark:text-gray-300">
            Sign Up
          </h2>
        </div>

        <SignUpForm />

      </Card>
    </main>
  );
}
