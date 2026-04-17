import { createStore } from 'tinybase';
import { TinyBaseNamespaceRepository } from '@/lib/store/tinybase/namespace.tinybase';

describe('TinyBaseNamespaceRepository', () => {
  let repo: TinyBaseNamespaceRepository;

  beforeEach(() => {
    repo = new TinyBaseNamespaceRepository(createStore());
  });

  it('registers a slug and retrieves it', async () => {
    const ns = await repo.register({ slug: 'enopax', entityType: 'ORGANISATION', entityId: 'org-1' });
    expect(ns.id).toBeDefined();
    expect(ns.slug).toBe('enopax');
    expect(ns.entityType).toBe('ORGANISATION');
    expect(ns.entityId).toBe('org-1');
    expect(ns.createdAt).toBeInstanceOf(Date);

    const found = await repo.findBySlug('enopax');
    expect(found).not.toBeNull();
    expect(found!.id).toBe(ns.id);
  });

  it('rejects duplicate slugs', async () => {
    await repo.register({ slug: 'felix', entityType: 'USER', entityId: 'user-1' });
    await expect(
      repo.register({ slug: 'felix', entityType: 'ORGANISATION', entityId: 'org-2' })
    ).rejects.toThrow('already taken');
  });

  it('checks availability', async () => {
    expect(await repo.isAvailable('newslug')).toBe(true);
    await repo.register({ slug: 'newslug', entityType: 'USER', entityId: 'user-1' });
    expect(await repo.isAvailable('newslug')).toBe(false);
  });

  it('deletes a namespace entry', async () => {
    await repo.register({ slug: 'temp', entityType: 'ORGANISATION', entityId: 'org-1' });
    await repo.delete('temp');
    const found = await repo.findBySlug('temp');
    expect(found).toBeNull();
  });
});
