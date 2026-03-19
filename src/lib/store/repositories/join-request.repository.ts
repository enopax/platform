import type { OrganisationJoinRequest, JoinRequestStatus } from '../types';

export interface CreateJoinRequestData {
  userId: string;
  organisationId: string;
  message?: string;
}

export interface UpdateJoinRequestData {
  status: JoinRequestStatus;
  respondedBy?: string;
  respondedAt?: Date;
  responseMessage?: string;
}

export interface IJoinRequestRepository {
  create(data: CreateJoinRequestData): Promise<OrganisationJoinRequest>;
  findById(id: string): Promise<OrganisationJoinRequest | null>;
  findByUserAndOrg(userId: string, organisationId: string, status?: JoinRequestStatus): Promise<OrganisationJoinRequest | null>;
  findLatestByUserAndOrg(userId: string, organisationId: string): Promise<OrganisationJoinRequest | null>;
  findByOrgId(organisationId: string, status?: JoinRequestStatus): Promise<OrganisationJoinRequest[]>;
  update(id: string, data: UpdateJoinRequestData): Promise<OrganisationJoinRequest>;
}
