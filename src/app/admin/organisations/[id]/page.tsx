import { notFound } from 'next/navigation';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import OrganisationForm from '@/components/form/OrganisationForm';
import MemberList from '@/components/common/MemberList';
import { updateOrganisation, type UpdateOrganisationState } from '@/actions/organisation';

interface EditOrganisationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrganisationPage({ params }: EditOrganisationPageProps) {
  const { id } = await params;

  const [organisation, users] = await Promise.all([
    prisma.organisation.findUnique({
      where: { id },
      include: {
        owner: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstname: true,
                lastname: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: [
            { role: 'asc' },
            { joinedAt: 'asc' }
          ]
        },
        _count: {
          select: {
            members: true,
            teams: true,
            projects: true
          }
        }
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
  ]);

  if (!organisation) {
    notFound();
  }

  return (
    <main className="mt-4">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <Headline>Edit Organisation</Headline>
          <Link href="/admin/organisations">
            <Button variant="light">Back to Organisations</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Organisation Form */}
          <div className="lg:col-span-2">
            <Card>
              <OrganisationForm 
                action={updateOrganisation.bind(null, organisation.id)}
                initialState={{
                  success: false,
                  error: undefined,
                  fieldErrors: undefined,
                }}
                mode="update"
                organisation={organisation}
                users={users} 
              />
            </Card>
          </div>

          {/* Members List */}
          <div>
            <MemberList 
              members={organisation.members || []}
              title="Members"
              compact={true}
              maxHeight="max-h-96"
              showJoinDate={false}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}