import { getStoreAsync } from '@/lib/store';

export async function seedNamespaces(): Promise<{ registered: number; skipped: number; errors: string[] }> {
  const store = await getStoreAsync();
  let registered = 0;
  let skipped = 0;
  const errors: string[] = [];

  const allOrgs = await store.organisations.search('', 10000);
  for (const org of allOrgs) {
    const slug = org.slug || org.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    try {
      const existing = await store.namespaces.findBySlug(slug);
      if (existing) {
        skipped++;
        continue;
      }
      await store.namespaces.register({
        slug,
        entityType: 'ORGANISATION',
        entityId: org.id,
      });
      registered++;
    } catch (e: unknown) {
      errors.push(`Org "${org.name}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const allUsers = await store.users.findMany({ take: 10000 });
  for (const user of allUsers) {
    const slug = user.slug || user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
    try {
      const existing = await store.namespaces.findBySlug(slug);
      if (existing) {
        skipped++;
        continue;
      }
      await store.namespaces.register({
        slug,
        entityType: 'USER',
        entityId: user.id,
      });
      registered++;
    } catch (e: unknown) {
      errors.push(`User "${user.email}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { registered, skipped, errors };
}
