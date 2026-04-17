import type { Namespace, NamespaceEntityType } from '../types';

export interface RegisterNamespaceData {
  slug: string;
  entityType: NamespaceEntityType;
  entityId: string;
}

export interface INamespaceRepository {
  register(data: RegisterNamespaceData): Promise<Namespace>;
  findBySlug(slug: string): Promise<Namespace | null>;
  findByEntity(entityType: NamespaceEntityType, entityId: string): Promise<Namespace | null>;
  isAvailable(slug: string): Promise<boolean>;
  delete(slug: string): Promise<void>;
}
