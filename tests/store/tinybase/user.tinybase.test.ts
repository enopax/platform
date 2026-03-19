import { createStore } from 'tinybase';
import { TinyBaseUserRepository } from '@/lib/store/tinybase/user.tinybase';
import type { CreateUserData } from '@/lib/store/repositories/user.repository';

describe('TinyBaseUserRepository', () => {
  let repo: TinyBaseUserRepository;

  beforeEach(() => {
    repo = new TinyBaseUserRepository(createStore());
  });

  const sampleUser: CreateUserData = {
    name: 'John Doe',
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    role: 'CUSTOMER',
  };

  describe('create', () => {
    it('creates a user with generated id and timestamps', async () => {
      const user = await repo.create(sampleUser);
      expect(user.id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe('CUSTOMER');
      expect(user.storageTier).toBe('FREE_500MB');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('defaults role to CUSTOMER', async () => {
      const user = await repo.create({ email: 'test@example.com' });
      expect(user.role).toBe('CUSTOMER');
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const created = await repo.create(sampleUser);
      const found = await repo.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.email).toBe('john@example.com');
    });

    it('returns null for missing id', async () => {
      expect(await repo.findById('nonexistent')).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      await repo.create(sampleUser);
      const found = await repo.findByEmail('john@example.com');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('John Doe');
    });

    it('returns null for unknown email', async () => {
      expect(await repo.findByEmail('unknown@example.com')).toBeNull();
    });
  });

  describe('findMany', () => {
    it('returns all users', async () => {
      await repo.create(sampleUser);
      await repo.create({ ...sampleUser, email: 'jane@example.com', name: 'Jane' });
      const users = await repo.findMany();
      expect(users).toHaveLength(2);
    });

    it('supports pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.create({ ...sampleUser, email: `user${i}@example.com` });
      }
      const page = await repo.findMany({ skip: 1, take: 2 });
      expect(page).toHaveLength(2);
    });

    it('orders by createdAt desc', async () => {
      await repo.create({ ...sampleUser, email: 'first@example.com', name: 'First' });
      await new Promise(r => setTimeout(r, 5));
      await repo.create({ ...sampleUser, email: 'second@example.com', name: 'Second' });

      const users = await repo.findMany({ orderBy: 'createdAt' });
      expect(users[0].name).toBe('Second');
    });
  });

  describe('update', () => {
    it('updates name and email', async () => {
      const user = await repo.create(sampleUser);
      const updated = await repo.update(user.id, { name: 'Jane Doe', email: 'jane@example.com' });
      expect(updated.name).toBe('Jane Doe');
      expect(updated.email).toBe('jane@example.com');
    });

    it('updates role', async () => {
      const user = await repo.create(sampleUser);
      const updated = await repo.update(user.id, { role: 'ADMIN' });
      expect(updated.role).toBe('ADMIN');
    });

    it('sets nullable fields to null', async () => {
      const user = await repo.create(sampleUser);
      const updated = await repo.update(user.id, { firstname: null, lastname: null });
      expect(updated.firstname).toBeNull();
      expect(updated.lastname).toBeNull();
    });

    it('updates password', async () => {
      const user = await repo.create(sampleUser);
      const updated = await repo.update(user.id, { password: 'new-hash' });
      expect(updated.password).toBe('new-hash');
    });

    it('throws for missing user', async () => {
      await expect(repo.update('missing', { name: 'x' })).rejects.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await repo.create({ ...sampleUser, email: 'alice@example.com', name: 'Alice Smith', firstname: 'Alice', lastname: 'Smith' });
      await repo.create({ ...sampleUser, email: 'bob@example.com', name: 'Bob Jones', firstname: 'Bob', lastname: 'Jones' });
      await repo.create({ ...sampleUser, email: 'carol@example.com', name: 'Carol Smith', firstname: 'Carol', lastname: 'Smith' });
    });

    it('searches by name (case-insensitive)', async () => {
      const results = await repo.search('alice');
      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('alice@example.com');
    });

    it('searches by email', async () => {
      const results = await repo.search('bob@');
      expect(results).toHaveLength(1);
    });

    it('searches by lastname', async () => {
      const results = await repo.search('smith');
      expect(results).toHaveLength(2);
    });

    it('respects limit', async () => {
      const results = await repo.search('example.com', 2);
      expect(results).toHaveLength(2);
    });

    it('returns empty for no match', async () => {
      const results = await repo.search('zzzzz');
      expect(results).toEqual([]);
    });
  });

  describe('count', () => {
    it('returns 0 when empty', async () => {
      expect(await repo.count()).toBe(0);
    });

    it('returns correct count', async () => {
      await repo.create(sampleUser);
      await repo.create({ ...sampleUser, email: 'other@example.com' });
      expect(await repo.count()).toBe(2);
    });
  });
});
