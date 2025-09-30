import { redirect } from 'next/navigation';

interface AddResourcePageProps {
  params: Promise<{ orgName: string; projectId: string }>;
}

// Redirect to the organisation-level resource creation page
export default async function AddResourcePage({ params }: AddResourcePageProps) {
  const { orgName, projectId } = await params;

  // Redirect to organisation resources/new with project context
  redirect(`/main/organisations/${orgName}/resources/new?project=${projectId}`);
}