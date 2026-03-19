import type { Store } from 'tinybase';
import type { Organisation, OrganisationMember, OrganisationRole } from '../types';
import type {
  IOrganisationRepository, CreateOrganisationData, OrganisationWithMemberCount,
  IOrganisationMemberRepository, OrganisationMemberWithUser,
} from '../repositories/organisation.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const ORG_TABLE = 'organisations';
const MEMBER_TABLE = 'organisation-members';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToOrg(id: string, row: Record<string, any>): Organisation {
  return {
    id,
    name: row.name as string,
    description: (row.description as string) || null,
    website: (row.website as string) || null,
    streetAddress: (row.streetAddress as string) || null,
    city: (row.city as string) || null,
    state: (row.state as string) || null,
    postalCode: (row.postalCode as string) || null,
    country: (row.country as string) || null,
    phone: (row.phone as string) || null,
    email: (row.email as string) || null,
    logo: (row.logo as string) || null,
    vatNumber: (row.vatNumber as string) || null,
    taxId: (row.taxId as string) || null,
    billingEmail: (row.billingEmail as string) || null,
    paymentMethods: null,
    subscriptionId: (row.subscriptionId as string) || null,
    subscriptionTier: (row.subscriptionTier as string) || null,
    subscriptionEnds: row.subscriptionEnds ? new Date(row.subscriptionEnds as string) : null,
    isActive: row.isActive === 1,
    maxProjects: (row.maxProjects as number) || null,
    maxMembers: (row.maxMembers as number) || null,
    maxTeams: (row.maxTeams as number) || null,
    ownerId: row.ownerId as string,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function rowToMember(id: string, row: Record<string, any>): OrganisationMember {
  return {
    id,
    userId: row.userId as string,
    organisationId: row.organisationId as string,
    role: row.role as OrganisationRole,
    joinedAt: new Date(row.joinedAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export class TinyBaseOrganisationRepository implements IOrganisationRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  private countMembers(orgId: string): number {
    if (this.persister) {
      return this.persister.lookupIndex('organisation-members', 'organisationId', orgId).length;
    }
    let count = 0;
    for (const id of this.store.getRowIds(MEMBER_TABLE)) {
      if (this.store.getRow(MEMBER_TABLE, id).organisationId === orgId) count++;
    }
    return count;
  }

  async create(data: CreateOrganisationData & { ownerId: string }): Promise<Organisation> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(ORG_TABLE, id, {
      name: data.name,
      description: data.description ?? '',
      website: data.website ?? '',
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United Kingdom',
      phone: data.phone ?? '',
      email: data.email ?? '',
      logo: data.logo ?? '',
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
      ownerId: data.ownerId,
      createdAt: now,
      updatedAt: now,
    });

    return rowToOrg(id, this.store.getRow(ORG_TABLE, id));
  }

  async findById(id: string): Promise<Organisation | null> {
    const row = this.store.getRow(ORG_TABLE, id);
    if (!row.name) return null;
    return rowToOrg(id, row);
  }

  async findByIdWithMemberCount(id: string): Promise<OrganisationWithMemberCount | null> {
    const org = await this.findById(id);
    if (!org) return null;
    return { ...org, memberCount: this.countMembers(id) };
  }

  async findByName(name: string): Promise<Organisation | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex('organisations', 'name', name);
      if (ids.length > 0) {
        const row = this.store.getRow(ORG_TABLE, ids[0]);
        if (row.name) return rowToOrg(ids[0], row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(ORG_TABLE)) {
      const row = this.store.getRow(ORG_TABLE, id);
      if (row.name === name) return rowToOrg(id, row);
    }
    return null;
  }

  async findByNameWithMemberCount(name: string): Promise<OrganisationWithMemberCount | null> {
    const org = await this.findByName(name);
    if (!org) return null;
    return { ...org, memberCount: this.countMembers(org.id) };
  }

  async update(id: string, data: Partial<CreateOrganisationData> & { isActive?: boolean }): Promise<Organisation> {
    const row = this.store.getRow(ORG_TABLE, id);
    if (!row.name) throw new Error(`Organisation ${id} not found`);

    if (data.name !== undefined) this.store.setCell(ORG_TABLE, id, 'name', data.name);
    if (data.description !== undefined) this.store.setCell(ORG_TABLE, id, 'description', data.description ?? '');
    if (data.website !== undefined) this.store.setCell(ORG_TABLE, id, 'website', data.website ?? '');
    if (data.phone !== undefined) this.store.setCell(ORG_TABLE, id, 'phone', data.phone ?? '');
    if (data.email !== undefined) this.store.setCell(ORG_TABLE, id, 'email', data.email ?? '');
    if (data.logo !== undefined) this.store.setCell(ORG_TABLE, id, 'logo', data.logo ?? '');
    if (data.isActive !== undefined) this.store.setCell(ORG_TABLE, id, 'isActive', data.isActive ? 1 : 0);
    this.store.setCell(ORG_TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToOrg(id, this.store.getRow(ORG_TABLE, id));
  }

  async search(query: string, limit: number = 10): Promise<Organisation[]> {
    const q = query.toLowerCase();
    let results: Organisation[] = [];

    for (const id of this.store.getRowIds(ORG_TABLE)) {
      const row = this.store.getRow(ORG_TABLE, id);
      if (row.isActive !== 1) continue;

      const matches =
        ((row.name as string) || '').toLowerCase().includes(q) ||
        ((row.description as string) || '').toLowerCase().includes(q);

      if (matches) results.push(rowToOrg(id, row));
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return results.slice(0, limit);
  }

  async findActiveByName(name: string, excludeId?: string): Promise<Organisation | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex('organisations', 'name', name);
      for (const id of ids) {
        if (id === excludeId) continue;
        const row = this.store.getRow(ORG_TABLE, id);
        if (row.name === name && row.isActive === 1) return rowToOrg(id, row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(ORG_TABLE)) {
      const row = this.store.getRow(ORG_TABLE, id);
      if (row.name === name && row.isActive === 1 && id !== excludeId) {
        return rowToOrg(id, row);
      }
    }
    return null;
  }
}

export class TinyBaseOrganisationMemberRepository implements IOrganisationMemberRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: { userId: string; organisationId: string; role: OrganisationRole }): Promise<OrganisationMember> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(MEMBER_TABLE, id, {
      userId: data.userId,
      organisationId: data.organisationId,
      role: data.role,
      joinedAt: now,
      updatedAt: now,
    });

    return rowToMember(id, this.store.getRow(MEMBER_TABLE, id));
  }

  async findByUserAndOrg(userId: string, organisationId: string): Promise<OrganisationMember | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex('organisation-members', 'userId', userId);
      for (const id of ids) {
        const row = this.store.getRow(MEMBER_TABLE, id);
        if (row.organisationId === organisationId) return rowToMember(id, row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(MEMBER_TABLE)) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (row.userId === userId && row.organisationId === organisationId) {
        return rowToMember(id, row);
      }
    }
    return null;
  }

  async findByUserId(userId: string): Promise<(OrganisationMember & { organisation: Organisation })[]> {
    const results: (OrganisationMember & { organisation: Organisation })[] = [];

    const memberIds = this.persister
      ? this.persister.lookupIndex('organisation-members', 'userId', userId)
      : this.store.getRowIds(MEMBER_TABLE);

    for (const id of memberIds) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (!this.persister && row.userId !== userId) continue;

      const orgRow = this.store.getRow(ORG_TABLE, row.organisationId as string);
      if (!orgRow.name) continue;

      results.push({
        ...rowToMember(id, row),
        organisation: rowToOrg(row.organisationId as string, orgRow),
      });
    }

    results.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
    return results;
  }

  async findByOrgId(organisationId: string): Promise<OrganisationMemberWithUser[]> {
    const results: OrganisationMemberWithUser[] = [];

    const memberIds = this.persister
      ? this.persister.lookupIndex('organisation-members', 'organisationId', organisationId)
      : this.store.getRowIds(MEMBER_TABLE);

    for (const id of memberIds) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (!this.persister && row.organisationId !== organisationId) continue;

      const userRow = this.store.getRow('users', row.userId as string);
      results.push({
        ...rowToMember(id, row),
        user: {
          id: row.userId as string,
          name: (userRow.name as string) || null,
          email: (userRow.email as string) || '',
          image: (userRow.image as string) || null,
        },
      });
    }

    return results;
  }

  async delete(userId: string, organisationId: string): Promise<void> {
    if (this.persister) {
      const ids = this.persister.lookupIndex('organisation-members', 'userId', userId);
      for (const id of ids) {
        const row = this.store.getRow(MEMBER_TABLE, id);
        if (row.organisationId === organisationId) {
          this.store.delRow(MEMBER_TABLE, id);
          return;
        }
      }
      return;
    }
    for (const id of this.store.getRowIds(MEMBER_TABLE)) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (row.userId === userId && row.organisationId === organisationId) {
        this.store.delRow(MEMBER_TABLE, id);
        return;
      }
    }
  }
}
