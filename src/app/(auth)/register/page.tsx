import { getStoreAsync } from '@/lib/store';
import RegisterForm from './RegisterForm';

interface RegisterPageProps {
  searchParams: Promise<{ invite?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { invite } = await searchParams;

  let prefilledEmail: string | undefined;
  let invitedRole: string | undefined;
  let organisationName: string | undefined;

  if (invite) {
    const store = await getStoreAsync();
    const invitation = await store.invitations.findByToken(invite);
    if (invitation && invitation.status === 'PENDING' && invitation.expiresAt > new Date()) {
      prefilledEmail = invitation.email;
      invitedRole = invitation.role;
      const organisation = await store.organisations.findById(invitation.organisationId);
      organisationName = organisation?.name;
    }
  }

  return (
    <RegisterForm
      prefilledEmail={prefilledEmail}
      inviteToken={invite}
      organisationName={organisationName}
      invitedRole={invitedRole}
    />
  );
}
