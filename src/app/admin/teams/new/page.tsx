import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import TeamForm from '@/components/form/TeamForm';
import { createTeam, type CreateTeamState } from '@/actions/team';

export default async function NewTeamPage() {
  const [users, organisations] = await Promise.all([
    prisma.user.findMany({
      orderBy: { email: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        firstname: true,
        lastname: true,
      },
    }),
    prisma.organisation.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <main className="mt-4">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Headline>Create New Team</Headline>
          <Link href="/admin/teams">
            <Button variant="light">Back to Teams</Button>
          </Link>
        </div>

        <Card>
          <TeamForm
            organisations={organisations}
            cancelUrl="/admin/teams"
          />
        </Card>
      </Container>
    </main>
  );
}