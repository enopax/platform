import { createTestStore } from './helpers';
import { setStore, resetStore } from '@/lib/store/data-store';
import { UserService } from '@/lib/services/user';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    resetStore();
    setStore(createTestStore());
    service = new UserService();
  });

  describe('createUser', () => {
    it('creates a user with default role CUSTOMER', async () => {
      const user = await service.createUser({ email: 'alice@example.com', name: 'Alice' });
      expect(user.email).toBe('alice@example.com');
      expect(user.role).toBe('CUSTOMER');
    });

    it('creates a user with specified role', async () => {
      const user = await service.createUser({ email: 'admin@example.com', role: 'ADMIN' });
      expect(user.role).toBe('ADMIN');
    });
  });

  describe('getUserById / getUserByEmail', () => {
    it('finds user by id', async () => {
      const created = await service.createUser({ email: 'bob@example.com' });
      const found = await service.getUserById(created.id);
      expect(found).not.toBeNull();
      expect(found!.email).toBe('bob@example.com');
    });

    it('finds user by email', async () => {
      await service.createUser({ email: 'carol@example.com', name: 'Carol' });
      const found = await service.getUserByEmail('carol@example.com');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('Carol');
    });

    it('returns null for nonexistent user', async () => {
      expect(await service.getUserById('nonexistent')).toBeNull();
      expect(await service.getUserByEmail('nobody@example.com')).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('updates user fields', async () => {
      const user = await service.createUser({ email: 'dave@example.com', name: 'Dave' });
      const updated = await service.updateUser(user.id, { name: 'David' });
      expect(updated.name).toBe('David');
      expect(updated.email).toBe('dave@example.com');
    });
  });

  describe('updateUserAdmin', () => {
    it('allows admin to update another user', async () => {
      const admin = await service.createUser({ email: 'admin@example.com', role: 'ADMIN' });
      const user = await service.createUser({ email: 'user@example.com', name: 'User' });

      const updated = await service.updateUserAdmin(user.id, { name: 'Updated' }, admin.id);
      expect(updated.name).toBe('Updated');
    });

    it('rejects non-admin updating another user', async () => {
      const nonAdmin = await service.createUser({ email: 'regular@example.com', role: 'CUSTOMER' });
      const user = await service.createUser({ email: 'user@example.com' });

      await expect(
        service.updateUserAdmin(user.id, { name: 'Hacked' }, nonAdmin.id)
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('setUserAvatar', () => {
    it('sets avatar to first image', async () => {
      const user = await service.createUser({ email: 'eve@example.com' });
      const updated = await service.setUserAvatar(user.id, ['https://img.example.com/avatar.png']);
      expect(updated.image).toBe('https://img.example.com/avatar.png');
    });

    it('sets avatar to null when empty array', async () => {
      const user = await service.createUser({ email: 'eve@example.com', image: 'old.png' });
      const updated = await service.setUserAvatar(user.id, []);
      expect(updated.image).toBeNull();
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      await service.createUser({ email: 'alice@example.com', firstname: 'Alice', lastname: 'Smith' });
      await service.createUser({ email: 'bob@example.com', firstname: 'Bob', lastname: 'Jones' });
      await service.createUser({ email: 'carol@example.com', firstname: 'Carol', lastname: 'Smith' });
    });

    it('searches by name', async () => {
      const results = await service.searchUsers('alice');
      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('alice@example.com');
    });

    it('searches by lastname', async () => {
      const results = await service.searchUsers('smith');
      expect(results).toHaveLength(2);
    });

    it('returns empty array on error gracefully', async () => {
      const results = await service.searchUsers('zzzzz');
      expect(results).toEqual([]);
    });
  });

  describe('deactivateUser', () => {
    it('sets role to GUEST', async () => {
      const user = await service.createUser({ email: 'frank@example.com', role: 'CUSTOMER' });
      const deactivated = await service.deactivateUser(user.id);
      expect(deactivated.role).toBe('GUEST');
    });
  });

  describe('validateUserExists', () => {
    it('returns true for existing user', async () => {
      const user = await service.createUser({ email: 'grace@example.com' });
      expect(await service.validateUserExists(user.id)).toBe(true);
    });

    it('returns false for nonexistent user', async () => {
      expect(await service.validateUserExists('nonexistent')).toBe(false);
    });
  });

  describe('isUserAdmin', () => {
    it('returns true for admin', async () => {
      const admin = await service.createUser({ email: 'admin@example.com', role: 'ADMIN' });
      expect(await service.isUserAdmin(admin.id)).toBe(true);
    });

    it('returns false for non-admin', async () => {
      const user = await service.createUser({ email: 'user@example.com', role: 'CUSTOMER' });
      expect(await service.isUserAdmin(user.id)).toBe(false);
    });
  });
});
