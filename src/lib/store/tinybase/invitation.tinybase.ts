import type { Store } from 'tinybase';
import type { OrganisationInvitation, OrganisationRole, InvitationStatus } from '../types';
import type { IInvitationRepository, CreateInvitationData, UpdateInvitationData } from '../repositories/invitation.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'organisation-invitations';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToInvitation(id: string, row: Record<string, any>): OrganisationInvitation {
  return {
    id,
    token: row.token as string,
    email: row.email as string,
    organisationId: row.organisationId as string,
    role: row.role as OrganisationRole,
    invitedBy: row.invitedBy as string,
    status: row.status as InvitationStatus,
    expiresAt: new Date(row.expiresAt as string),
    acceptedAt: row.acceptedAt ? new Date(row.acceptedAt as string) : null,
    acceptedByUserId: (row.acceptedByUserId as string) || null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

export class TinyBaseInvitationRepository implements IInvitationRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateInvitationData): Promise<OrganisationInvitation> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      token: data.token,
      email: data.email,
      organisationId: data.organisationId,
      role: data.role,
      invitedBy: data.invitedBy,
      status: 'PENDING',
      expiresAt: data.expiresAt.toISOString(),
      acceptedAt: '',
      acceptedByUserId: '',
      createdAt: now,
      updatedAt: now,
    });

    return rowToInvitation(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<OrganisationInvitation | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.token) return null;
    return rowToInvitation(id, row);
  }

  async findByToken(token: string): Promise<OrganisationInvitation | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex(TABLE, 'token', token);
      if (ids.length > 0) {
        const row = this.store.getRow(TABLE, ids[0]);
        if (row.token) return rowToInvitation(ids[0], row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.token === token) return rowToInvitation(id, row);
    }
    return null;
  }

  async findByEmailAndOrg(email: string, organisationId: string, status?: InvitationStatus): Promise<OrganisationInvitation | null> {
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.email !== email || row.organisationId !== organisationId) continue;
      if (status && row.status !== status) continue;
      return rowToInvitation(id, row);
    }
    return null;
  }

  async findByOrgId(organisationId: string, status?: InvitationStatus): Promise<OrganisationInvitation[]> {
    const results: OrganisationInvitation[] = [];

    const rowIds = this.persister
      ? this.persister.lookupIndex(TABLE, 'organisationId', organisationId)
      : this.store.getRowIds(TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.organisationId !== organisationId) continue;
      if (status && row.status !== status) continue;
      results.push(rowToInvitation(id, row));
    }

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results;
  }

  async update(id: string, data: UpdateInvitationData): Promise<OrganisationInvitation> {
    const row = this.store.getRow(TABLE, id);
    if (!row.token) throw new Error(`Invitation ${id} not found`);

    if (data.status !== undefined) this.store.setCell(TABLE, id, 'status', data.status);
    if (data.acceptedAt !== undefined) this.store.setCell(TABLE, id, 'acceptedAt', data.acceptedAt ? data.acceptedAt.toISOString() : '');
    if (data.acceptedByUserId !== undefined) this.store.setCell(TABLE, id, 'acceptedByUserId', data.acceptedByUserId ?? '');
    this.store.setCell(TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToInvitation(id, this.store.getRow(TABLE, id));
  }
}
