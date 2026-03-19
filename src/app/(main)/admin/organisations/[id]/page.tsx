import { notFound } from 'next/navigation';
import Container from '@/components/common/Container';
import Headline from '@/components/common/Headline';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { getStoreAsync } from '@/lib/store';
import Link from 'next/link';
import OrganisationForm from '@/components/form/OrganisationForm';
import MemberList from '@/components/common/MemberList';
import { updateOrganisation, type UpdateOrganisationState } from '@/actions/organisation';

interface EditOrganisationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrganisationPage({ params }: EditOrganisationPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const store = await getStoreAsync();

  const [orgData, storeMembers, users] = await Promise.all([
    store.organisations.findById(id),
    store.organisationMembers.findByOrgId(id),
    store.users.findMany(),
  ]);

  if (!orgData) {
    notFound();
  }

  const owner = await store.users.findById(orgData.ownerId);

  const members = await Promise.all(
    storeMembers.map(async (m) => {
      const user = await store.users.findById(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        organisationId: m.organisationId,
        role: m.role,
        joinedAt: m.joinedAt,
        updatedAt: m.updatedAt,
        user: {
          id: m.userId,
          name: user?.name ?? null,
          firstname: user?.firstname ?? null,
          lastname: user?.lastname ?? null,
          email: user?.email ?? '',
          image: user?.image ?? null,
        },
      };
    })
  );

  const roleOrder = { OWNER: 0, MANAGER: 1, MEMBER: 2 };
  members.sort((a, b) => {
    const roleCompare = (roleOrder[a.role as keyof typeof roleOrder] ?? 3) - (roleOrder[b.role as keyof typeof roleOrder] ?? 3);
    if (roleCompare !== 0) return roleCompare;
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });

  if (!owner) {
    notFound();
  }

  const organisation = {
    ...orgData,
    owner,
    members,
    _count: {
      members: members.length,
      projects: 0,
    },
  };

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
              members={(organisation.members || []) as { id: string; role: 'OWNER' | 'MANAGER' | 'MEMBER'; joinedAt: Date; user: { id: string; name: string | null; firstname: string | null; lastname: string | null; email: string; image: string | null } }[]}
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
