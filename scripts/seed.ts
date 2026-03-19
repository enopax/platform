/**
 * Seed script — populates TinyBase with sample data for development.
 *
 * Usage: npx ts-node scripts/seed.ts
 *    or: npx tsx scripts/seed.ts
 */

import { createStore } from 'tinybase';
import { createFilePersister } from 'tinybase/persisters/persister-file';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { hashSync, genSaltSync } from 'bcrypt-ts';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

async function seed() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const store = createStore();
  const persister = createFilePersister(store, STORE_FILE);

  await persister.load();

  const existingUsers = store.getRowIds('users');
  if (existingUsers.length > 0) {
    console.log(`Store already has ${existingUsers.length} users. Skipping seed.`);
    console.log('To re-seed, delete data/store.json first.');
    await persister.destroy();
    return;
  }

  console.log('Seeding TinyBase store...\n');
  const now = new Date().toISOString();
  const passwordHash = hashSync('password123', genSaltSync(10));

  // Users
  const adminId = generateId();
  const userId = generateId();

  store.setRow('users', adminId, {
    firstname: 'Admin',
    lastname: 'User',
    name: 'Admin User',
    email: 'admin@enopax.io',
    emailVerified: '',
    image: '',
    password: passwordHash,
    role: 'ADMIN',
    storageTier: 'FREE_500MB',
    createdAt: now,
    updatedAt: now,
  });

  store.setRow('users', userId, {
    firstname: 'Test',
    lastname: 'User',
    name: 'Test User',
    email: 'user@enopax.io',
    emailVerified: '',
    image: '',
    password: passwordHash,
    role: 'CUSTOMER',
    storageTier: 'FREE_500MB',
    createdAt: now,
    updatedAt: now,
  });

  console.log(`  Created user: admin@enopax.io (ADMIN)`);
  console.log(`  Created user: user@enopax.io (CUSTOMER)`);

  // Organisation
  const orgId = generateId();

  store.setRow('organisations', orgId, {
    name: 'enopax',
    description: 'Default organisation',
    website: 'https://enopax.com',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United Kingdom',
    phone: '',
    email: '',
    logo: '',
    vatNumber: '',
    taxId: '',
    billingEmail: '',
    subscriptionId: '',
    subscriptionTier: 'FREE',
    subscriptionEnds: '',
    isActive: 1,
    maxProjects: 50,
    maxMembers: 100,
    maxTeams: 10,
    ownerId: adminId,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`  Created organisation: enopax`);

  // Organisation members
  const member1Id = generateId();
  const member2Id = generateId();

  store.setRow('organisation-members', member1Id, {
    userId: adminId,
    organisationId: orgId,
    role: 'OWNER',
    joinedAt: now,
    updatedAt: now,
  });

  store.setRow('organisation-members', member2Id, {
    userId: userId,
    organisationId: orgId,
    role: 'MEMBER',
    joinedAt: now,
    updatedAt: now,
  });

  console.log(`  Added admin as OWNER, user as MEMBER`);

  // Project
  const projectId = generateId();

  store.setRow('projects', projectId, {
    name: 'demo-project',
    description: 'A demo project for testing',
    development: 1,
    status: 'ACTIVE',
    priority: 'MEDIUM',
    budget: '',
    currency: 'GBP',
    startDate: now,
    endDate: '',
    actualEndDate: '',
    progress: 0,
    repositoryUrl: '',
    documentationUrl: '',
    organisationId: orgId,
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`  Created project: demo-project`);

  await persister.save();
  await persister.destroy();

  console.log(`\nSeed complete. Data written to ${STORE_FILE}`);
  console.log('\nTest credentials (platform TinyBase users):');
  console.log('  admin@enopax.io / password123');
  console.log('  user@enopax.io / password123');
  console.log('\nNote: These are platform-side users. You also need matching');
  console.log('Dex users — create them via: ../idp/scripts/add-user.sh');
}

seed().catch(console.error);
