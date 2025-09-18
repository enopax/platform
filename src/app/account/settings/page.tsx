import { notFound } from 'next/navigation'
import Container from '@/components/common/Container';
import { Card } from '@/components/common/Card';
import BackButton from '@/components/common/BackButton';
import SettingsForm from '@/components/form/SettingsForm';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Avatar from '@/components/common/Avatar';
import UploadImageForm from '@/components/form/UploadImageForm';
import { setAvatar } from '@/actions/user';

export default async function Page() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      firstname: true,
      lastname: true,
      role: true,
      storageTier: true,
      emailVerified: true
    }
  });

  if (!user) return notFound();
  
  return (
    <main>
      <Card className="m-20 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mb-8 text-2xl font-extrabold text-gray-900 dark:text-gray-300">
            Account Settings
          </h2>
        </div>

        <div>
          <div className="mb-4 flex flex-col items-center gap-2">
            <Avatar
              name="Avatar"
              size="large"
              image={user.image}
            />

            <UploadImageForm
              id={user.id}
              action={setAvatar}
            />
          </div>

          <SettingsForm user={user} />
        </div>
      </Card>
    </main>
  );
}
