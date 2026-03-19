import { notFound } from 'next/navigation';
import { getStoreAsync } from '@/lib/store';
import { OrganisationProvider } from '@/contexts/OrganisationContext';

export default async function OrganisationLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ orgaName: string }>;
}>) {
  const { orgaName } = await params;

  if (!orgaName) {
    notFound();
  }

  const store = await getStoreAsync();
  const organisation = await store.organisations.findByName(orgaName);

  if (!organisation || !organisation.isActive) {
    notFound();
  }

  return (
    <OrganisationProvider organisation={organisation}>
      {children}
    </OrganisationProvider>
  );
}
