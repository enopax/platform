# Access Control Design — Organisations, Teams, Projects, Roles

**Date:** 2026-04-15
**Status:** Draft, pending review
**Author:** Felix Böhm

---

## 1. Context

### Current state (2026-04-15)

- `Organisation` with `OrganisationMember` table. Fixed roles: `OWNER | ADMIN | MANAGER | MEMBER`.
- `Project` belongs to a single `Organisation`. Projects have **no members of their own** — access is inherited wholesale from the parent org.
- No `Team` entity. A legacy Teams stub from the upstream fork was removed in PR #54.
- No custom roles. No direct project-level grants. No external users.

### What we're designing

A model where **Teams** are reusable groups of people defined at the Org level, assigned to Projects with per-project roles. Custom roles on Projects are possible. Cross-org collaboration is reserved as a future phase — MVP is single-org only.

---

## 2. Decisions

| # | Question | Decision | Rationale |
|---|---|---|---|
| D1 | Team-only vs direct project members? | **Teams only** | Felix's preference: no micro-managing individual project grants. External contractors join a regular or purpose-built "External" team rather than getting ad-hoc direct grants. |
| D2 | Scope of custom roles? | **Org-level, reused across projects** | Enforces consistency. Start with 3-5 built-in project roles; custom roles a Phase 2 feature when real demand surfaces. |
| D3 | How do org-roles and project-team-roles combine? | **Tiered**: OWNER + ADMIN auto-admin on every project; MANAGER + MEMBER only via team assignment | Least privilege for regular members; a Trust Tier that can always rescue a project. Shown explicitly in the project member list ("Alice — Admin via Org OWNER role") so access is auditable, not hidden. |
| D4 | External users and cross-org collaboration? | **Not in MVP.** Spec out as Phase 3. MVP is single-org with externals handled by joining a Team inside the host org. | Most mature platforms ship single-tenant first; cross-org is a large scope that deserves its own design pass. |

### OWNER vs ADMIN

Standard distinction:
- **OWNER**: ultimate authority. Can delete the org. Can transfer ownership. Can grant/revoke OWNER role. Can remove other ADMINs. 1-2 per org typically.
- **ADMIN**: can manage members and teams, change settings, admin all projects — but cannot delete the org, cannot transfer ownership, cannot demote/remove other ADMINs or OWNERs. 5-20% of members.

Both are auto-admin on all projects (D3 Tiered rule).

---

## 3. Domain Model

### Entities

```
User
  id, email, name, password, createdAt, ...

Organisation
  id, name, ownerId, ...

OrganisationMember
  id, userId, organisationId
  role: OWNER | ADMIN | MANAGER | MEMBER
  joinedAt, updatedAt

Team
  id, organisationId, name, description
  defaultProjectRole: ProjectRole (see §4)
  createdAt, updatedAt
  — Fully user-defined. No hardcoded purpose enum. Name and description
    are free text (e.g. "Backend", "Ops", "Sprint 42 contractors", or
    whatever makes sense for the org).
  — defaultProjectRole captures the team's natural character (Backend →
    DEVELOPER, Ops → DEPLOYER). Used as pre-fill when assigning the team
    to a project — admin can override per project.
  — On org creation, a default team "All Members" (defaultRole: DEVELOPER)
    is seeded as a normal Team row — not a system-level special case.
    Admins can rename, repurpose, or delete it like any other team.

TeamMember
  id, teamId, userId
  addedAt, addedBy

Project
  id, organisationId, name, ...  (unchanged)

ProjectAccess
  id, projectId, teamId
  role: ProjectRole (see §4)
  grantedAt, grantedBy
  — role is always stored explicitly. When assigning a team to a project,
    the UI pre-fills with team.defaultProjectRole but the admin can change
    it. No "use default" indirection — the stored value IS the role.

(Phase 2)
ProjectRoleDefinition
  id, organisationId, name, description, permissions (bitmask or JSON)
  isBuiltIn: boolean  — built-ins aren't user-editable
  — In Phase 2, Team.defaultProjectRole and ProjectAccess.role become
    references to ProjectRoleDefinition instead of a fixed enum.
    Same architecture, just flexible values.
```

### Relationships

- `Organisation` 1..N `OrganisationMember` — standard membership
- `Organisation` 1..N `Team` — teams live inside an org
- `Team` 1..N `TeamMember` — users can be in multiple teams
- `Organisation` 1..N `Project`
- `Project` 1..N `ProjectAccess` — a project grants access to a team with a specific role
- `Team` 1..N `ProjectAccess` — the same team can be attached to many projects, possibly with different roles per project

### Invariants

- A user can be a `TeamMember` without being an `OrganisationMember` (reserved for Phase 3 — not enforced in MVP). In MVP, all team members are also org members.
- A `Team` belongs to exactly one `Organisation`. Teams are not shared across orgs.
- A `Project` can have zero or more `ProjectAccess` rows.
- Removing a `Team` cascades to all its `ProjectAccess` rows.
- Removing a `Project` cascades to all its `ProjectAccess` rows (not to teams).

---

## 4. Permission Model

### Project Roles (built-in, Phase 1)

| Role | Permissions |
|---|---|
| `VIEWER` | Read project metadata, view resources and their status. No writes. |
| `DEVELOPER` | VIEWER + create/edit/delete resources within the project. Cannot change project settings or members. |
| `DEPLOYER` | DEVELOPER + trigger deployments / provisioning actions. (Split from DEVELOPER because deploy is the most sensitive IaaS operation.) |
| `ADMIN` | DEPLOYER + manage project settings and manage team access to the project (add/remove teams, change team roles). |

*Out of MVP, we may also want a `REVIEWER` role for approval flows — not needed yet.*

### Permission resolution (effective permissions)

For a user `U` asking "can I do action `A` on project `P`?":

1. **Tiered auto-admin check:** If `U` has `OrganisationMember` role in the parent org equal to `OWNER` or `ADMIN` → `U` has `ADMIN` project permissions on `P`.
2. **Team-based grants:** Otherwise, collect every `ProjectAccess` row where `P` is the project and `U` is a member of the referenced team. `U`'s effective project role is the **highest (most permissive)** of all those rows.
3. **No grant found:** `U` has no access to `P`. The project doesn't appear in their navigation.

**Rules:**
- **Union-of-all-grants**. No deny rules (per research: deny-wins causes most "why can't I?" support tickets).
- No team nesting. A team is a flat list of users.
- Most permissive role wins when a user is in multiple teams with access to the same project.

### Visibility rules

- Org OWNER/ADMIN always see every project in the org (consequence of D3 tiered).
- Org MANAGER/MEMBER only see projects where they have team-granted access.
- On a project's member list, surface *why* each user has access:
  - "Alice — Admin via Org OWNER role"
  - "Bob — Developer via Team Frontend"
  - "Charlie — Developer via Team Frontend · Deployer via Team Ops" (show highest + tooltip with all sources)

---

## 5. UX Implications

### Org admin flows

- `/orga/{name}/teams` (new) — list teams, create team, view members
- `/orga/{name}/teams/{teamName}` — manage team members, see projects this team has access to
- `/orga/{name}/members` (exists) — unchanged at surface level; tiered auto-admin badge for OWNER/ADMIN
- `/orga/{name}/settings/roles` (Phase 2) — manage custom project roles

### Project admin flows

- `/orga/{orgName}/{projectName}/access` (new) — list teams with access + their roles, add team, change role, remove team
- `/orga/{orgName}/{projectName}/members` (new) — read-only derived view showing effective members (sourced from teams + tiered auto-admin), with the "why" column

### Member discovery

- An org MEMBER who gets added to a team with project access will see that project appear in their nav on next reload.
- No "request to join project" in MVP — only admin/manager can grant team access.

---

## 6. Phased Roadmap

### Phase 1 — Teams Infrastructure (MVP, this work)

**Scope:**
- New entities: `Team`, `TeamMember`, `ProjectAccess`
- Built-in project roles (VIEWER / DEVELOPER / DEPLOYER / ADMIN) hard-coded
- Team CRUD pages under `/orga/{name}/teams`
- Project access page under `/orga/{orgName}/{projectName}/access`
- Derived member view on project pages
- Permission resolution on every server-side access check (new helper: `resolveProjectPermissions(userId, projectId) → ProjectRole | null`)

**Out of scope for Phase 1:**
- Custom roles
- External / cross-org users
- Permission UI beyond "what role does this team have on this project"
- Migration of existing data — currently only one org with no teams; Phase 1 can land cleanly without migration

**Acceptance:**
- An org OWNER can create a team, add members, attach to a project with a role.
- A plain Org MEMBER assigned to a team sees only projects granted via that team.
- An Org ADMIN sees all projects.
- The "why this user has access" trace is visible on the project access page.

### Phase 2 — Custom Roles

**Scope:**
- `ProjectRoleDefinition` entity (org-scoped)
- Role editor UI at `/orga/{name}/settings/roles`
- Permission primitives formalised (discrete actions: view, write-resource, deploy, manage-members, manage-settings, ...)
- Built-in roles become seeded records in `ProjectRoleDefinition` with `isBuiltIn: true` (uneditable names, permissions editable only by forking into a new custom role)

**Trigger:** when ≥2 customers ask for a role the built-ins don't cover. Until then, don't build it.

### Phase 3 — Cross-Org Collaboration

**Scope:** instead of external users joining a host org, Project X is jointly owned by Org A (host) and Org B (collaborator). Each org sees the project in their own org space; each assigns their own teams with their own project roles.

**Entities likely added:**
```
ProjectCollaboration
  id, projectId, collaboratingOrgId
  status: INVITED | ACTIVE | REMOVED
  invitedBy, acceptedBy, invitedAt, acceptedAt

TeamProjectAccess (renamed from Phase 1's ProjectAccess)
  id, projectId, teamId, teamOrgId  (team can now belong to host or collab org)
  role: ProjectRole
```

**Host org has final say:** delete project, rename, change billing arrangement. Collab orgs can contribute via teams but can't transfer or delete.

**Effective permissions:** same union-of-team-grants; collaboration doesn't change the resolution algorithm — just which teams can be attached.

**Not MVP because:** significant scope (new invite flow for orgs, host-vs-collab permission asymmetry, shared billing unclear, auditability across orgs) and unclear demand. Revisit when first real multi-party project comes up.

---

## 7. Migration from current state

Prod data today:
- 1 active org (Enopax) with Felix (OWNER) and Andi (pending — will be MEMBER)
- 2 projects (Resource-Tests, ResourceTest) — both inherit access via Felix's OWNER status
- No teams, no custom roles

**Phase 1 go-live requires no data migration** for existing projects: the tiered auto-admin rule (D3) means Felix (OWNER) keeps full access without any new records; Andi needs to be added to a team to see projects (or just use the current fallback while we're single-user-org).

A one-time seed is advisable: the "All Members" default team (seeded on org creation as a normal team — see §3) should be created for the existing Enopax org, all current org members auto-added, and granted `DEVELOPER` on all existing projects. Keeps existing member behaviour the same until admins set up proper teams.

---

## 8. Resolved Questions

- **Q1 — Team visibility:** Depends on Org Role. Viewing the team list (names, descriptions) is a **permission** attached to Org Roles. OWNER/ADMIN/MANAGER see all teams. MEMBER sees only teams they belong to. This is enforced via the permission model, not a hardcoded rule — so custom org roles (if ever added) can grant or withhold team visibility.
- **Q2 — Can a team have zero members?** Yes. Empty teams serve as templates or placeholders. They grant no access until members are added.
- **Q3 — Can an Org MEMBER be removed while they're in teams?** Yes — removing the OrganisationMember cascades: all their TeamMember rows are deleted, which removes all their project access via those teams. The UI warns the admin before confirming, listing which teams and projects the user will lose access to.
- **Q4 — Audit log:** Yes. For Phase 1, log: team created/updated/deleted, team member added/removed, project access granted/changed/revoked. Use the existing `audit-logs` table.
- **Q5 — Naming collision (OrganisationMember vs TeamMember):** Keep both names. They match industry convention and are distinct concepts.
- **Q6 — Project "owner":** No dedicated project-owner concept. Projects are administered by Org OWNER/ADMIN (tiered auto-admin, D3) and by teams with the `ADMIN` ProjectRole. The `ADMIN` ProjectRole gives a team project-level control (settings, team access management) without requiring Org-level admin privileges — so a project lead can manage their project without being an Org ADMIN.

---

## 9. References

- Research brief: access-control patterns across GitHub, GitLab, Notion, Linear, Figma, Jira, Azure DevOps, AWS IAM/Okta — see conversation context.
- Felix's scope decisions (conversation, 2026-04-15): D1=A (team-only), D2=A (org-level custom roles), D3=C (tiered), D4=not-in-MVP.
- Prior removal of legacy Teams stub: PR #54.
- Current invitation flow (Org-level membership): PRs #58, #59, #61.
