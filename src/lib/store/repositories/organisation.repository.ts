import type { Organisation, OrganisationMember, OrganisationRole } from '../types';

export interface CreateOrganisationData {
  name: string;
  description?: string;
  website?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
}

export interface OrganisationWithMemberCount extends Organisation {
  memberCount: number;
}

export interface OrganisationMemberWithUser extends OrganisationMember {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface IOrganisationRepository {
  create(data: CreateOrganisationData & { ownerId: string }): Promise<Organisation>;
  findById(id: string): Promise<Organisation | null>;
  findByIdWithMemberCount(id: string): Promise<OrganisationWithMemberCount | null>;
  findByName(name: string): Promise<Organisation | null>;
  findByNameWithMemberCount(name: string): Promise<OrganisationWithMemberCount | null>;
  update(id: string, data: Partial<CreateOrganisationData> & { isActive?: boolean; visibility?: string }): Promise<Organisation>;
  search(query: string, limit?: number): Promise<Organisation[]>;
  findActiveByName(name: string, excludeId?: string): Promise<Organisation | null>;
}

export interface IOrganisationMemberRepository {
  create(data: { userId: string; organisationId: string; role: OrganisationRole }): Promise<OrganisationMember>;
  findByUserAndOrg(userId: string, organisationId: string): Promise<OrganisationMember | null>;
  findByUserId(userId: string): Promise<(OrganisationMember & { organisation: Organisation })[]>;
  findByOrgId(organisationId: string): Promise<OrganisationMemberWithUser[]>;
  delete(userId: string, organisationId: string): Promise<void>;
}
