import type { OrganisationInvitation, OrganisationRole, InvitationStatus } from '../types';

export interface CreateInvitationData {
  token: string;
  email: string;
  organisationId: string;
  role: OrganisationRole;
  invitedBy: string;
  expiresAt: Date;
}

export interface UpdateInvitationData {
  status?: InvitationStatus;
  acceptedAt?: Date | null;
  acceptedByUserId?: string | null;
}

export interface IInvitationRepository {
  create(data: CreateInvitationData): Promise<OrganisationInvitation>;
  findById(id: string): Promise<OrganisationInvitation | null>;
  findByToken(token: string): Promise<OrganisationInvitation | null>;
  findByEmailAndOrg(email: string, organisationId: string, status?: InvitationStatus): Promise<OrganisationInvitation | null>;
  findByOrgId(organisationId: string, status?: InvitationStatus): Promise<OrganisationInvitation[]>;
  update(id: string, data: UpdateInvitationData): Promise<OrganisationInvitation>;
}
