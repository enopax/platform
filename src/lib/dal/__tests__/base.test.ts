/**
 * Base Model Tests
 *
 * Tests for the BaseModel class that provides CRUD operations for all models.
 *
 * Test Coverage:
 * - ID generation (nanoid)
 * - Timestamp generation (createdAt, updatedAt)
 * - CRUD operations (create, findById, findMany, update, delete)
 * - Helper methods (count, exists)
 * - Type conversion (Date objects ↔ ISO strings)
 * - Edge cases (not found, empty results)
 */

import { BaseModel } from '../base';
import { getDB, resetDB } from '@/lib/tinybase/db';

interface TestRecord {
  id: string;
  name: string;
  email: string;
  age?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class TestModel extends BaseModel<TestRecord> {
  protected tableName = 'test';

  async findByEmail(email: string): Promise<TestRecord | null> {
    const records = await this.findMany((r) => r.email === email);
    return records[0] || null;
  }

  async findByAge(age: number): Promise<TestRecord[]> {
    return this.findMany((r) => r.age === age);
  }
}

describe('BaseModel', () => {
  let model: TestModel;

  beforeEach(async () => {
    await resetDB();
    model = new TestModel();
  });

  describe('create', () => {
    it('should create a record with auto-generated ID', async () => {
      const data = {
        name: 'Alice',
        email: 'alice@example.com',
        age: 30,
      };

      const record = await model.create(data);

      expect(record.id).toBeDefined();
      expect(typeof record.id).toBe('string');
      expect(record.id.length).toBeGreaterThan(0);
      expect(record.name).toBe(data.name);
      expect(record.email).toBe(data.email);
      expect(record.age).toBe(data.age);
    });

    it('should auto-set createdAt timestamp', async () => {
      const beforeCreate = new Date();
      const record = await model.create({
        name: 'Bob',
        email: 'bob@example.com',
      });
      const afterCreate = new Date();

      expect(record.createdAt).toBeDefined();
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.createdAt!.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(record.createdAt!.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should auto-set updatedAt timestamp', async () => {
      const beforeCreate = new Date();
      const record = await model.create({
        name: 'Charlie',
        email: 'charlie@example.com',
      });
      const afterCreate = new Date();

      expect(record.updatedAt).toBeDefined();
      expect(record.updatedAt).toBeInstanceOf(Date);
      expect(record.updatedAt!.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(record.updatedAt!.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should set createdAt and updatedAt to same value on create', async () => {
      const record = await model.create({
        name: 'David',
        email: 'david@example.com',
      });

      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
      expect(record.createdAt!.getTime()).toBe(record.updatedAt!.getTime());
    });
  });

  describe('findById', () => {
    it('should find record by ID', async () => {
      const created = await model.create({
        name: 'Eve',
        email: 'eve@example.com',
      });

      const found = await model.findById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe(created.name);
      expect(found!.email).toBe(created.email);
    });

    it('should return null if record not found', async () => {
      const found = await model.findById('non-existent-id');

      expect(found).toBeNull();
    });

    it('should convert date strings to Date objects', async () => {
      const created = await model.create({
        name: 'Frank',
        email: 'frank@example.com',
      });

      const found = await model.findById(created.id);

      expect(found!.createdAt).toBeInstanceOf(Date);
      expect(found!.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findMany', () => {
    it('should return all records when no filter provided', async () => {
      await model.create({ name: 'User 1', email: 'user1@example.com' });
      await model.create({ name: 'User 2', email: 'user2@example.com' });
      await model.create({ name: 'User 3', email: 'user3@example.com' });

      const records = await model.findMany();

      expect(records).toHaveLength(3);
      expect(records.map((r) => r.name)).toEqual(
        expect.arrayContaining(['User 1', 'User 2', 'User 3'])
      );
    });

    it('should filter records when filter provided', async () => {
      await model.create({ name: 'Alice', email: 'alice@example.com', age: 25 });
      await model.create({ name: 'Bob', email: 'bob@example.com', age: 30 });
      await model.create({ name: 'Charlie', email: 'charlie@example.com', age: 25 });

      const records = await model.findMany((r) => r.age === 25);

      expect(records).toHaveLength(2);
      expect(records.map((r) => r.name)).toEqual(
        expect.arrayContaining(['Alice', 'Charlie'])
      );
    });

    it('should return empty array if no matches', async () => {
      await model.create({ name: 'Alice', email: 'alice@example.com', age: 25 });

      const records = await model.findMany((r) => r.age === 99);

      expect(records).toEqual([]);
    });

    it('should return empty array if table is empty', async () => {
      const records = await model.findMany();

      expect(records).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update record and return updated data', async () => {
      const created = await model.create({
        name: 'Grace',
        email: 'grace@example.com',
        age: 28,
      });

      const updated = await model.update(created.id, {
        name: 'Grace Updated',
        age: 29,
      });

      expect(updated).toBeDefined();
      expect(updated!.id).toBe(created.id);
      expect(updated!.name).toBe('Grace Updated');
      expect(updated!.age).toBe(29);
      expect(updated!.email).toBe(created.email);
    });

    it('should update updatedAt timestamp', async () => {
      const created = await model.create({
        name: 'Henry',
        email: 'henry@example.com',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await model.update(created.id, {
        name: 'Henry Updated',
      });

      expect(updated!.updatedAt).toBeDefined();
      expect(updated!.updatedAt!.getTime()).toBeGreaterThan(
        created.updatedAt!.getTime()
      );
    });

    it('should not update createdAt timestamp', async () => {
      const created = await model.create({
        name: 'Ivy',
        email: 'ivy@example.com',
      });

      const updated = await model.update(created.id, {
        name: 'Ivy Updated',
      });

      expect(updated!.createdAt).toBeDefined();
      expect(updated!.createdAt!.getTime()).toBe(created.createdAt!.getTime());
    });

    it('should return null if record not found', async () => {
      const updated = await model.update('non-existent-id', {
        name: 'Updated',
      });

      expect(updated).toBeNull();
    });

    it('should allow partial updates', async () => {
      const created = await model.create({
        name: 'Jack',
        email: 'jack@example.com',
        age: 35,
      });

      const updated = await model.update(created.id, {
        age: 36,
      });

      expect(updated!.name).toBe(created.name);
      expect(updated!.email).toBe(created.email);
      expect(updated!.age).toBe(36);
    });
  });

  describe('delete', () => {
    it('should delete record and return true', async () => {
      const created = await model.create({
        name: 'Karen',
        email: 'karen@example.com',
      });

      const deleted = await model.delete(created.id);

      expect(deleted).toBe(true);

      const found = await model.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false if record not found', async () => {
      const deleted = await model.delete('non-existent-id');

      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all records when no filter provided', async () => {
      await model.create({ name: 'User 1', email: 'user1@example.com' });
      await model.create({ name: 'User 2', email: 'user2@example.com' });
      await model.create({ name: 'User 3', email: 'user3@example.com' });

      const count = await model.count();

      expect(count).toBe(3);
    });

    it('should count filtered records when filter provided', async () => {
      await model.create({ name: 'Alice', email: 'alice@example.com', age: 25 });
      await model.create({ name: 'Bob', email: 'bob@example.com', age: 30 });
      await model.create({ name: 'Charlie', email: 'charlie@example.com', age: 25 });

      const count = await model.count((r) => r.age === 25);

      expect(count).toBe(2);
    });

    it('should return 0 if no records', async () => {
      const count = await model.count();

      expect(count).toBe(0);
    });
  });

  describe('exists', () => {
    it('should return true if record exists', async () => {
      const created = await model.create({
        name: 'Leo',
        email: 'leo@example.com',
      });

      const exists = await model.exists(created.id);

      expect(exists).toBe(true);
    });

    it('should return false if record does not exist', async () => {
      const exists = await model.exists('non-existent-id');

      expect(exists).toBe(false);
    });
  });

  describe('custom methods', () => {
    it('should support custom finder methods', async () => {
      await model.create({ name: 'Alice', email: 'alice@example.com' });
      await model.create({ name: 'Bob', email: 'bob@example.com' });

      const found = await model.findByEmail('alice@example.com');

      expect(found).toBeDefined();
      expect(found!.name).toBe('Alice');
    });

    it('should support custom filter methods', async () => {
      await model.create({ name: 'Alice', email: 'alice@example.com', age: 25 });
      await model.create({ name: 'Bob', email: 'bob@example.com', age: 30 });
      await model.create({ name: 'Charlie', email: 'charlie@example.com', age: 25 });

      const found = await model.findByAge(25);

      expect(found).toHaveLength(2);
      expect(found.map((r) => r.name)).toEqual(
        expect.arrayContaining(['Alice', 'Charlie'])
      );
    });
  });
});
