import { notFound } from 'next/navigation';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import TeamForm from '@/components/form/TeamForm';
import { updateTeam, type UpdateTeamState } from '@/actions/team';

interface EditTeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const { id } = await params;

  const [team, users, organisations] = await Promise.all([
    prisma.team.findUnique({
      where: { id },
      include: {
        owner: true,
        organisation: true,
      },
    }),
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

  if (!team) {
    notFound();
  }

  return (
    <main className="mt-4">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Headline>Edit Team</Headline>
          <Link href="/admin/teams">
            <Button variant="light">Back to Teams</Button>
          </Link>
        </div>

        <Card>
          <TeamForm
            team={team}
            organisations={organisations}
            cancelUrl="/admin/teams"
          />
        </Card>
      </Container>
    </main>
  );
}