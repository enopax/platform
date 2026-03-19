import type { UserFile } from '../types';

export interface CreateUserFileData {
  userId: string;
  projectId?: string;
  ipfsHash: string;
  fileName: string;
  fileSize: bigint;
  fileType: string;
  nodeLocations?: string[];
  metadata?: unknown;
}

export interface IUserFileRepository {
  create(data: CreateUserFileData): Promise<UserFile>;
  findById(id: string): Promise<UserFile | null>;
  findByUserId(userId: string, options?: { skip?: number; take?: number; orderBy?: 'uploadedAt' }): Promise<UserFile[]>;
  findByProjectId(projectId: string): Promise<UserFile[]>;
  findByUserAndHash(userId: string, ipfsHash: string): Promise<UserFile | null>;
  update(id: string, data: Partial<Pick<UserFile, 'isPinned' | 'replicationCount' | 'nodeLocations' | 'metadata' | 'lastSyncAt' | 'projectId'>>): Promise<UserFile>;
  delete(id: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}
