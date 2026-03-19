import type { Store } from 'tinybase';
import type { OrganisationJoinRequest, JoinRequestStatus } from '../types';
import type { IJoinRequestRepository, CreateJoinRequestData, UpdateJoinRequestData } from '../repositories/join-request.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'join-requests';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToJoinRequest(id: string, row: Record<string, any>): OrganisationJoinRequest {
  return {
    id,
    userId: row.userId as string,
    organisationId: row.organisationId as string,
    status: row.status as JoinRequestStatus,
    respondedBy: (row.respondedBy as string) || null,
    requestedAt: new Date(row.requestedAt as string),
    respondedAt: row.respondedAt ? new Date(row.respondedAt as string) : null,
    updatedAt: new Date(row.updatedAt as string),
  };
}

export class TinyBaseJoinRequestRepository implements IJoinRequestRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateJoinRequestData): Promise<OrganisationJoinRequest> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      userId: data.userId,
      organisationId: data.organisationId,
      status: 'PENDING',
      respondedBy: '',
      requestedAt: now,
      respondedAt: '',
      updatedAt: now,
    });

    return rowToJoinRequest(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<OrganisationJoinRequest | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.userId) return null;
    return rowToJoinRequest(id, row);
  }

  async findByUserAndOrg(userId: string, organisationId: string, status?: JoinRequestStatus): Promise<OrganisationJoinRequest | null> {
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.userId === userId && row.organisationId === organisationId) {
        if (status && row.status !== status) continue;
        return rowToJoinRequest(id, row);
      }
    }
    return null;
  }

  async findLatestByUserAndOrg(userId: string, organisationId: string): Promise<OrganisationJoinRequest | null> {
    let latest: OrganisationJoinRequest | null = null;

    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.userId !== userId || row.organisationId !== organisationId) continue;
      const req = rowToJoinRequest(id, row);
      if (!latest || req.requestedAt > latest.requestedAt) latest = req;
    }

    return latest;
  }

  async findByOrgId(organisationId: string, status?: JoinRequestStatus): Promise<OrganisationJoinRequest[]> {
    const results: OrganisationJoinRequest[] = [];

    const rowIds = this.persister
      ? this.persister.lookupIndex('join-requests', 'organisationId', organisationId)
      : this.store.getRowIds(TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.organisationId !== organisationId) continue;
      if (status && row.status !== status) continue;
      results.push(rowToJoinRequest(id, row));
    }

    results.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    return results;
  }

  async update(id: string, data: UpdateJoinRequestData): Promise<OrganisationJoinRequest> {
    const row = this.store.getRow(TABLE, id);
    if (!row.userId) throw new Error(`JoinRequest ${id} not found`);

    this.store.setCell(TABLE, id, 'status', data.status);
    if (data.respondedBy !== undefined) this.store.setCell(TABLE, id, 'respondedBy', data.respondedBy ?? '');
    if (data.respondedAt !== undefined) this.store.setCell(TABLE, id, 'respondedAt', data.respondedAt ? data.respondedAt.toISOString() : '');
    this.store.setCell(TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToJoinRequest(id, this.store.getRow(TABLE, id));
  }
}
