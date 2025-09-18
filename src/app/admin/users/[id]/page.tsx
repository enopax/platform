import { notFound } from 'next/navigation';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import UpdateUserForm from '@/components/form/UpdateUserForm';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    notFound();
  }

  return (
    <main className="mt-4">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Headline>Edit User</Headline>
          <Link href="/admin/user">
            <Button variant="light">Back to Users</Button>
          </Link>
        </div>

        <Card>
          <UpdateUserForm user={user} />
        </Card>
      </Container>
    </main>
  );
}