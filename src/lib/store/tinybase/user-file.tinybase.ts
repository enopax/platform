import type { Store } from 'tinybase';
import type { UserFile } from '../types';
import type { IUserFileRepository, CreateUserFileData } from '../repositories/user-file.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TABLE = 'user-files';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToUserFile(id: string, row: Record<string, any>): UserFile {
  return {
    id,
    userId: row.userId as string,
    projectId: (row.projectId as string) || null,
    ipfsHash: row.ipfsHash as string,
    fileName: row.fileName as string,
    fileSize: BigInt(row.fileSize as string),
    fileType: row.fileType as string,
    uploadedAt: new Date(row.uploadedAt as string),
    isPinned: row.isPinned === 1,
    replicationCount: (row.replicationCount as number) || 0,
    nodeLocations: row.nodeLocations ? JSON.parse(row.nodeLocations as string) : [],
    metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
    lastSyncAt: new Date(row.lastSyncAt as string),
  };
}

export class TinyBaseUserFileRepository implements IUserFileRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateUserFileData): Promise<UserFile> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TABLE, id, {
      userId: data.userId,
      projectId: data.projectId ?? '',
      ipfsHash: data.ipfsHash,
      fileName: data.fileName,
      fileSize: data.fileSize.toString(),
      fileType: data.fileType,
      uploadedAt: now,
      isPinned: 1,
      replicationCount: 0,
      nodeLocations: JSON.stringify(data.nodeLocations ?? []),
      metadata: data.metadata ? JSON.stringify(data.metadata) : '',
      lastSyncAt: now,
    });

    return rowToUserFile(id, this.store.getRow(TABLE, id));
  }

  async findById(id: string): Promise<UserFile | null> {
    const row = this.store.getRow(TABLE, id);
    if (!row.userId) return null;
    return rowToUserFile(id, row);
  }

  async findByUserId(
    userId: string,
    options?: { skip?: number; take?: number; orderBy?: 'uploadedAt' }
  ): Promise<UserFile[]> {
    let results: UserFile[] = [];

    const rowIds = this.persister
      ? this.persister.lookupIndex('user-files', 'userId', userId)
      : this.store.getRowIds(TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.userId !== userId) continue;
      results.push(rowToUserFile(id, row));
    }

    if (options?.orderBy === 'uploadedAt') {
      results.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    }

    if (options?.skip) results = results.slice(options.skip);
    if (options?.take) results = results.slice(0, options.take);
    return results;
  }

  async findByProjectId(projectId: string): Promise<UserFile[]> {
    const results: UserFile[] = [];
    const rowIds = this.persister
      ? this.persister.lookupIndex('user-files', 'projectId', projectId)
      : this.store.getRowIds(TABLE);

    for (const id of rowIds) {
      const row = this.store.getRow(TABLE, id);
      if (!this.persister && row.projectId !== projectId) continue;
      results.push(rowToUserFile(id, row));
    }
    results.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    return results;
  }

  async findByUserAndHash(userId: string, ipfsHash: string): Promise<UserFile | null> {
    for (const id of this.store.getRowIds(TABLE)) {
      const row = this.store.getRow(TABLE, id);
      if (row.userId === userId && row.ipfsHash === ipfsHash) {
        return rowToUserFile(id, row);
      }
    }
    return null;
  }

  async update(
    id: string,
    data: Partial<Pick<UserFile, 'isPinned' | 'replicationCount' | 'nodeLocations' | 'metadata' | 'lastSyncAt' | 'projectId'>>
  ): Promise<UserFile> {
    const row = this.store.getRow(TABLE, id);
    if (!row.userId) throw new Error(`UserFile ${id} not found`);

    if (data.isPinned !== undefined) this.store.setCell(TABLE, id, 'isPinned', data.isPinned ? 1 : 0);
    if (data.replicationCount !== undefined) this.store.setCell(TABLE, id, 'replicationCount', data.replicationCount);
    if (data.nodeLocations !== undefined) this.store.setCell(TABLE, id, 'nodeLocations', JSON.stringify(data.nodeLocations));
    if (data.metadata !== undefined) this.store.setCell(TABLE, id, 'metadata', data.metadata ? JSON.stringify(data.metadata) : '');
    if (data.lastSyncAt !== undefined) this.store.setCell(TABLE, id, 'lastSyncAt', data.lastSyncAt.toISOString());
    if (data.projectId !== undefined) this.store.setCell(TABLE, id, 'projectId', data.projectId ?? '');

    return rowToUserFile(id, this.store.getRow(TABLE, id));
  }

  async delete(id: string): Promise<void> {
    this.store.delRow(TABLE, id);
  }

  async countByUserId(userId: string): Promise<number> {
    if (this.persister) {
      return this.persister.lookupIndex('user-files', 'userId', userId).length;
    }
    let count = 0;
    for (const id of this.store.getRowIds(TABLE)) {
      if (this.store.getRow(TABLE, id).userId === userId) count++;
    }
    return count;
  }
}
