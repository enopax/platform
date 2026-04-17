import type { Store } from 'tinybase';
import type { Team, TeamMember, ProjectRole } from '../types';
import type {
  ITeamRepository, CreateTeamData, UpdateTeamData,
  ITeamMemberRepository, AddTeamMemberData,
} from '../repositories/team.repository';
import type { FileRecordPersister } from './file-record-persister';
import crypto from 'crypto';

const TEAM_TABLE = 'teams';
const MEMBER_TABLE = 'team-members';

function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function rowToTeam(id: string, row: Record<string, any>): Team {
  return {
    id,
    organisationId: row.organisationId as string,
    name: row.name as string,
    description: (row.description as string) || null,
    defaultProjectRole: row.defaultProjectRole as ProjectRole,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function rowToMember(id: string, row: Record<string, any>): TeamMember {
  return {
    id,
    teamId: row.teamId as string,
    userId: row.userId as string,
    addedAt: new Date(row.addedAt as string),
    addedBy: row.addedBy as string,
  };
}

export class TinyBaseTeamRepository implements ITeamRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async create(data: CreateTeamData): Promise<Team> {
    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(TEAM_TABLE, id, {
      organisationId: data.organisationId,
      name: data.name,
      description: data.description ?? '',
      defaultProjectRole: data.defaultProjectRole,
      createdAt: now,
      updatedAt: now,
    });

    return rowToTeam(id, this.store.getRow(TEAM_TABLE, id));
  }

  async findById(id: string): Promise<Team | null> {
    const row = this.store.getRow(TEAM_TABLE, id);
    if (!row.name) return null;
    return rowToTeam(id, row);
  }

  async findByOrgId(organisationId: string): Promise<Team[]> {
    const results: Team[] = [];

    const ids = this.persister
      ? this.persister.lookupIndex(TEAM_TABLE, 'organisationId', organisationId)
      : this.store.getRowIds(TEAM_TABLE);

    for (const id of ids) {
      const row = this.store.getRow(TEAM_TABLE, id);
      if (!this.persister && row.organisationId !== organisationId) continue;
      if (!row.name) continue;
      results.push(rowToTeam(id, row));
    }

    return results;
  }

  async findByNameAndOrg(name: string, organisationId: string): Promise<Team | null> {
    const teams = await this.findByOrgId(organisationId);
    return teams.find(t => t.name === name) ?? null;
  }

  async update(id: string, data: UpdateTeamData): Promise<Team> {
    const row = this.store.getRow(TEAM_TABLE, id);
    if (!row.name) throw new Error(`Team ${id} not found`);

    if (data.name !== undefined) this.store.setCell(TEAM_TABLE, id, 'name', data.name);
    if (data.description !== undefined) this.store.setCell(TEAM_TABLE, id, 'description', data.description ?? '');
    if (data.defaultProjectRole !== undefined) this.store.setCell(TEAM_TABLE, id, 'defaultProjectRole', data.defaultProjectRole);
    this.store.setCell(TEAM_TABLE, id, 'updatedAt', new Date().toISOString());

    return rowToTeam(id, this.store.getRow(TEAM_TABLE, id));
  }

  async delete(id: string): Promise<void> {
    this.store.delRow(TEAM_TABLE, id);
  }
}

export class TinyBaseTeamMemberRepository implements ITeamMemberRepository {
  constructor(private store: Store, private persister?: FileRecordPersister) {}

  async add(data: AddTeamMemberData): Promise<TeamMember> {
    const existing = await this.findByTeamAndUser(data.teamId, data.userId);
    if (existing) return existing;

    const id = generateId();
    const now = new Date().toISOString();

    this.store.setRow(MEMBER_TABLE, id, {
      teamId: data.teamId,
      userId: data.userId,
      addedAt: now,
      addedBy: data.addedBy,
    });

    return rowToMember(id, this.store.getRow(MEMBER_TABLE, id));
  }

  async findByTeamId(teamId: string): Promise<TeamMember[]> {
    const results: TeamMember[] = [];

    const ids = this.persister
      ? this.persister.lookupIndex(MEMBER_TABLE, 'teamId', teamId)
      : this.store.getRowIds(MEMBER_TABLE);

    for (const id of ids) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (!this.persister && row.teamId !== teamId) continue;
      if (!row.userId) continue;
      results.push(rowToMember(id, row));
    }

    return results;
  }

  async findByUserId(userId: string): Promise<TeamMember[]> {
    const results: TeamMember[] = [];

    const ids = this.persister
      ? this.persister.lookupIndex(MEMBER_TABLE, 'userId', userId)
      : this.store.getRowIds(MEMBER_TABLE);

    for (const id of ids) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (!this.persister && row.userId !== userId) continue;
      if (!row.teamId) continue;
      results.push(rowToMember(id, row));
    }

    return results;
  }

  async findByTeamAndUser(teamId: string, userId: string): Promise<TeamMember | null> {
    if (this.persister) {
      const ids = this.persister.lookupIndex(MEMBER_TABLE, 'teamId', teamId);
      for (const id of ids) {
        const row = this.store.getRow(MEMBER_TABLE, id);
        if (row.userId === userId) return rowToMember(id, row);
      }
      return null;
    }
    for (const id of this.store.getRowIds(MEMBER_TABLE)) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (row.teamId === teamId && row.userId === userId) return rowToMember(id, row);
    }
    return null;
  }

  async remove(teamId: string, userId: string): Promise<void> {
    if (this.persister) {
      const ids = this.persister.lookupIndex(MEMBER_TABLE, 'teamId', teamId);
      for (const id of ids) {
        const row = this.store.getRow(MEMBER_TABLE, id);
        if (row.userId === userId) {
          this.store.delRow(MEMBER_TABLE, id);
          return;
        }
      }
      return;
    }
    for (const id of this.store.getRowIds(MEMBER_TABLE)) {
      const row = this.store.getRow(MEMBER_TABLE, id);
      if (row.teamId === teamId && row.userId === userId) {
        this.store.delRow(MEMBER_TABLE, id);
        return;
      }
    }
  }

  async removeAllForUser(userId: string): Promise<void> {
    const members = await this.findByUserId(userId);
    for (const m of members) {
      this.store.delRow(MEMBER_TABLE, m.id);
    }
  }

  async removeAllForTeam(teamId: string): Promise<void> {
    const members = await this.findByTeamId(teamId);
    for (const m of members) {
      this.store.delRow(MEMBER_TABLE, m.id);
    }
  }
}
