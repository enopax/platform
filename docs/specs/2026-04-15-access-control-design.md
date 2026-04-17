# Access Control Design — Organisations, Teams, Projects, Roles

**Date:** 2026-04-15 (updated 2026-04-17)
**Status:** Draft, pending review
**Author:** Felix Böhm

---

## 1. Context & Vision

### Current state

- `Organisation` with `OrganisationMember`. Fixed roles: `OWNER | ADMIN | MANAGER | MEMBER`.
- `Project` belongs to one `Organisation`. No project-level access control — inherited wholesale from org.
- No Teams, no custom roles, no visibility controls, no cross-org sharing, no personal namespace.
- Org and project names are URL slugs but have no separate display name.

### What we're designing

A professional access-control model inspired by GitHub's Organisations/Repos/Teams — adapted for an IaaS platform. Key principles:

- **User and Organisation are separate entities** that share a global URL namespace — like GitHub where `github.com/felixboehm` (user) and `github.com/enopax` (org) coexist but are fundamentally different things
- **Users own personal projects directly** — no org overhead, no teams, no settings confusion
- **Organisations own org projects via Teams** — the single mechanism for org-level project access (D1)
- **Cross-org sharing** replaces "external members" — share a project with another org or a user; same mechanism, no separate concept
- **Slugs + display names** everywhere
- **Public/private visibility** on orgs and projects
- **Custom project roles** in a later phase, built on a solid foundation

---

## 2. Namespacing & Slugs

### Slug + Display Name

Every addressable entity has both:

| Entity | Slug (URL-safe, unique) | Display Name (free text) |
|---|---|---|
| User | `felixboehm` | Felix Böhm |
| Organisation | `enopax` | Enopax GmbH |
| Project | `platform` (unique within parent) | Enopax Platform |

**Slug rules:** lowercase alphanumeric + hyphens, 2-39 chars, no leading/trailing hyphens, no consecutive hyphens.

### Shared global namespace

User slugs and Organisation slugs share the same pool. A global namespace table resolves which entity a slug belongs to:

```
Namespace
  slug: "felixboehm" → type: USER,         entityId: user-123
  slug: "enopax"     → type: ORGANISATION,  entityId: org-456
```

On user registration or org creation, the slug is checked against this table. Conflict → "this name is taken."

**Reserved slugs:** `account`, `admin`, `signin`, `register`, `accept-invite`, `api`, `_next`, `assets`, `icons`, `settings`, `new`, `explore`

### URLs

```
enopax.com/felixboehm              → User profile (personal projects)
enopax.com/felixboehm/experiment   → Personal project (owned by user)
enopax.com/enopax                  → Organisation overview (teams, projects)
enopax.com/enopax/platform         → Org project (owned by org)
enopax.com/enopax/members          → Org member management
enopax.com/enopax/teams            → Org team management
```

Routing: `/{slug}` → namespace lookup → render User profile or Org overview depending on entity type.

---

## 3. Decisions

| # | Question | Decision | Rationale |
|---|---|---|---|
| D1 | Team-only vs direct project members? | **Teams only** (within orgs) | No micro-managing within orgs. Cross-org sharing is a separate mechanism (see §6). |
| D2 | Scope of custom roles? | **Org-level, reused across projects** | Start with built-in project roles; custom roles Phase 2. |
| D3 | How do org-roles and project-team-roles combine? | **Tiered**: OWNER + ADMIN auto-admin on every project; MANAGER + MEMBER only via team | Least privilege + trust tier. Explicit in UI. |
| D5 | Namespace model? | **Shared global namespace**, User and Org are separate entities | No `isPersonal` hack. User ≠ Org. They share a URL space but are conceptually different. |
| D6 | Default org visibility? | **Public** | Discoverable by default. Admins can switch to private. |
| D7 | Cross-org sharing model? | Share with Org or User — same `ProjectShare` entity | No separate "external member" concept. Share with user = share with a person. Share with org = share with a company. One mechanism. |
| D8 | User = Org? | **No.** Separate entities. | Mixing them creates settings confusion, meaningless teams-of-one, billing ambiguity, and a conceptual lie ("I'm in my own org"). Clean separation, shared namespace. |

### OWNER vs ADMIN

- **OWNER**: ultimate authority. Delete org. Transfer ownership. Grant/revoke OWNER. Remove ADMINs. 1-2 per org.
- **ADMIN**: manage members, teams, settings, admin all projects. Cannot delete org, transfer ownership, or remove OWNERs.

Both are auto-admin on all projects (D3).

---

## 4. Visibility

### Organisation visibility

| Visibility | Behaviour |
|---|---|
| `PUBLIC` (default) | Visible in platform search. Profile page accessible. JoinRequest flow available. |
| `PRIVATE` | Only members see it. Join only via invitation. Not in search results. |

### Project visibility

| Visibility | Behaviour |
|---|---|
| `PUBLIC` | Anyone (even unauthenticated) can see description + resource status. Write/deploy still requires team access (org projects) or ownership (personal projects). |
| `INTERNAL` | All org members can view regardless of team assignment (org projects only). |
| `PRIVATE` | Only teams with ProjectAccess + tiered auto-admin can see it (org projects). Only owner can see it (personal projects). Default for new projects. |

**Org-level default:** setting on Organisation: `defaultProjectVisibility: PRIVATE | INTERNAL | PUBLIC`.

---

## 5. Domain Model

### Entities

```
Namespace (global slug registry)
  slug, entityType: USER | ORGANISATION, entityId
  — Enforces global uniqueness across users and orgs

User
  id, slug, name, email, password, createdAt, ...
  — slug registered in Namespace table
  — Can own personal projects directly (no org needed)
  — Has account settings (profile, password, email)
  — No teams, no members, no org-level settings

Organisation
  id, slug, name, description
  visibility: PUBLIC | PRIVATE
  defaultProjectVisibility: PRIVATE | INTERNAL | PUBLIC
  ownerId
  createdAt, updatedAt
  — slug registered in Namespace table
  — Has members, teams, org-level settings

OrganisationMember
  id, userId, organisationId
  role: OWNER | ADMIN | MANAGER | MEMBER
  joinedAt, updatedAt

Team
  id, organisationId, name, description
  defaultProjectRole: ProjectRole (see §7)
  createdAt, updatedAt
  — Fully user-defined. Name and description are free text.
  — defaultProjectRole captures the team's character (Backend →
    DEVELOPER, Ops → DEPLOYER). Pre-fills when assigning to a project;
    admin can override per project.
  — On org creation, a default team "All Members" (defaultRole:
    DEVELOPER) is seeded as a normal Team row. Admins can rename,
    repurpose, or delete it.

TeamMember
  id, teamId, userId
  addedAt, addedBy

Project
  id, slug, name, description
  ownerType: USER | ORGANISATION
  ownerId: (userId or organisationId)
  visibility: PUBLIC | INTERNAL | PRIVATE
  status, isActive, ...
  — slug unique within parent (owner)

ProjectAccess (org projects only)
  id, projectId, teamId
  role: ProjectRole (see §7)
  grantedAt, grantedBy
  — role stored explicitly. UI pre-fills from team.defaultProjectRole;
    admin can change. No "use default" indirection.
  — Only applies to org-owned projects. Personal projects don't need
    this — the owning user has full access inherently.

ProjectShare (Phase 1.5 — cross-entity sharing)
  id, projectId
  sharedWithType: USER | ORGANISATION
  sharedWithId: (userId or orgId)
  permission: VIEW | CONTRIBUTE | MANAGE
  sharedBy, sharedAt
  — Works for both: share with an org (their members get access)
    or share with a user (they get personal access).
  — Host owner (user or org) has final say.

(Phase 2)
ProjectRoleDefinition
  id, organisationId, name, description, permissions
  isBuiltIn: boolean
  — Team.defaultProjectRole and ProjectAccess.role become references
    to this entity instead of a fixed enum.
```

### Relationships

```
Namespace ← slug → User
Namespace ← slug → Organisation
User 1..N Project (personal, ownerType=USER)
Organisation 1..N Project (org, ownerType=ORGANISATION)
Organisation 1..N OrganisationMember
Organisation 1..N Team
Team 1..N TeamMember (users)
Project(org) 1..N ProjectAccess (team + role)
Project(any) 0..N ProjectShare (cross-entity sharing)
```

### Invariants

- Namespace table enforces: no two entities (user or org) share the same slug.
- A Team belongs to exactly one Organisation.
- All TeamMembers must also be OrganisationMembers of the same org.
- ProjectAccess only applies to org-owned projects. Personal projects have no ProjectAccess rows — the owner always has full access.
- Removing an OrganisationMember cascades: deletes all their TeamMember rows → removes all project access. UI warns before confirming.
- Removing a Team cascades to its ProjectAccess rows.
- Removing a Project cascades to its ProjectAccess + ProjectShare rows.

---

## 6. Cross-Org Collaboration (Phase 1.5)

### Core insight

**There are no "external members."** Sharing a project with external person Felix = sharing with user `felixboehm`. Sharing with company Acme = sharing with org `acme`. The `ProjectShare` entity handles both — `sharedWithType` distinguishes.

### How it works

1. Host owner shares Project X with Org B (or User C): creates a `ProjectShare` row.
2. Recipient sees Project X in their "Shared with you" section.
3. `ProjectShare.permission` controls what the recipient can do:

| Permission | What recipient can do |
|---|---|
| `VIEW` | See project metadata + resource status. Read-only. |
| `CONTRIBUTE` | VIEW + use/manage resources within the project. Cannot change project settings or sharing. |
| `MANAGE` | CONTRIBUTE + manage project settings and re-share (but cannot delete project — only host can). |

4. **Host has final say:** delete, rename, change billing, revoke shares.

### Sharing with User vs Org

- **Share with User:** that specific person gets the permission level directly. Simple — they're one person.
- **Share with Org:** all members of that org get the permission level. Within the collab org, the tiered rule applies (OWNER/ADMIN see shared projects; MANAGER/MEMBER see them if granted visibility — initially all org members see shared projects).

### Later improvements (Phase 3)

- Collab org assigns their own teams with per-project roles on shared projects
- Invite + accept flow (instead of direct share)
- Fine-grained per-share permission configuration

---

## 7. Permission Model

### Project Roles (built-in, Phase 1)

| Role | Permissions |
|---|---|
| `VIEWER` | Read project metadata, view resources and their status. |
| `DEVELOPER` | VIEWER + create/edit/delete resources. Cannot change project settings or access. |
| `DEPLOYER` | DEVELOPER + trigger deployments/provisioning. Separated because deploy is the most sensitive IaaS action. |
| `ADMIN` | DEPLOYER + manage project settings + manage team access (add/remove teams, change roles). |

### Permission resolution

For user `U` on project `P`:

**Personal project (ownerType = USER):**
1. If `U` is the owner → full access.
2. If `U` has a `ProjectShare` on `P` → share's permission level.
3. Visibility fallback: if PUBLIC → implicit VIEWER for everyone.
4. Otherwise → no access.

**Org project (ownerType = ORGANISATION):**
1. **Tiered auto-admin:** If `U` is OWNER or ADMIN in the parent org → ADMIN on `P`.
2. **Team grants:** Collect every ProjectAccess where `P` = project and `U` ∈ team. Effective role = highest of all.
3. **Cross-org share:** If `U` is a member of a collab org (or is the shared-with user) that has a ProjectShare on `P` → share's permission level, mapped to closest ProjectRole.
4. **Visibility fallback:** If `P` is INTERNAL and `U` is an org member → implicit VIEWER. If PUBLIC → implicit VIEWER for everyone.
5. **No grant:** `P` doesn't appear in `U`'s navigation.

**Rules:** Union-of-all-grants. No deny. No team nesting. Most permissive wins.

### Visibility in UI

On a project's access page, surface **why** each user has access:
- "Alice — Admin via Org OWNER role"
- "Bob — Developer via Team Backend"
- "Charlie — Viewer via shared with Org Acme"
- "Dave — Contributor via shared with user dave"

---

## 8. GitHub Comparison

### What we adopt from GitHub

| GitHub concept | Enopax equivalent |
|---|---|
| User + personal repos | User + personal projects (ownerType=USER) |
| Organisation | Organisation |
| Repository | Project |
| Team → repo permission | Team → ProjectAccess(role) |
| Org Owner / Member | OWNER / ADMIN / MANAGER / MEMBER |
| Public / private repos | Public / internal / private projects |
| Public / hidden org | Public / private orgs |
| Slug-based URLs, shared namespace | Same — `/{slug}/{project}` |
| Slug + display name | Same |
| User and Org are separate entities | Same — no `isPersonal` hack |

### Where we improve on GitHub

1. **One access path within orgs** — GitHub has Teams AND direct collaborators. Enopax has Teams only (D1). Cleaner within orgs.
2. **Team character** — `defaultProjectRole` on Team. GitHub teams are generic.
3. **Real cross-org sharing** — GitHub can't share a repo between two orgs. Only fork (copy that diverges) or transfer (one org loses it). Enopax supports true shared projects — the same project, jointly accessible.
4. **Transparent access traces** — "Admin via Org OWNER" in the project member view. GitHub hides implicit permissions.
5. **INTERNAL visibility** — all org members can read without explicit team assignment. GitHub Enterprise has this but it's buried.
6. **Cross-entity sharing** — share with a user OR an org via the same mechanism. GitHub has no clean equivalent.

### What we consciously skip

- **Nested teams** — adds complexity, rarely used. Teams are flat.
- **Forking** — our cross-org model is sharing (same project), not copying.
- **Template projects** — not in scope.

---

## 9. UX Implications

### URL structure

```
/{slug}                      → User profile or Org overview (namespace lookup)
/{slug}/{project}            → Project overview
/{slug}/members              → Org member management (org only)
/{slug}/teams                → Org team management (org only)
/{slug}/teams/{teamSlug}     → Team detail + members (org only)
/{slug}/{project}/access     → Project team access (org projects)
/{slug}/{project}/members    → Derived effective member view
/{slug}/{project}/settings   → Project settings
/{slug}/settings             → Org settings (org) or account settings (user)
```

### Sidebar navigation

```
felixboehm                 ← personal namespace (user profile link)
  └── experiment           ← personal projects
  └── test-api

Enopax                     ← organisation
  └── platform             ← org projects (filtered by team access)
  └── resource-api

Shared with you            ← projects shared from other entities
  └── acme/their-project
```

Clean separation: personal projects, org projects, shared projects. No "my org" confusion.

### Key flows

- **Create personal project:** `/{userSlug}` → "New Project" → name + visibility → done. No org, no teams.
- **Create org project:** `/{orgSlug}` → "New Project" → same, but project lives in org context.
- **Create team:** `/{orgSlug}/teams` → "New Team" → name + description + default role → done.
- **Add team to project:** `/{orgSlug}/{project}/access` → "Add Team" → pick team → role pre-filled → confirm.
- **Share project:** `/{slug}/{project}/settings` → "Share" → enter user slug or org slug → pick permission → done.

---

## 10. Phased Roadmap

### Phase 1 — Teams + Visibility + Slugs (MVP)

- Entities: `Namespace`, `Team`, `TeamMember`, `ProjectAccess`
- `slug` + `name` on User, Organisation, Project
- `Namespace` table for global slug uniqueness
- `ownerType` + `ownerId` on Project (USER or ORGANISATION)
- `visibility` on Organisation (PUBLIC/PRIVATE, default PUBLIC) and Project (PUBLIC/INTERNAL/PRIVATE)
- Built-in project roles (VIEWER / DEVELOPER / DEPLOYER / ADMIN)
- Team CRUD pages, project access page, derived member view
- Permission resolution helper: `resolveProjectPermissions(userId, projectId)`
- Flat URL routing (`/{slug}/{project}`) with namespace-based entity resolution
- Personal projects for users (no org overhead)
- Archive project (`status: ARCHIVED` — read-only, preserved)

### Phase 1.5 — Cross-Entity Sharing

- `ProjectShare` entity (sharedWithType: USER | ORGANISATION)
- Simple sharing: host shares project, picks permission level (VIEW/CONTRIBUTE/MANAGE)
- Recipient sees shared projects in "Shared with you" section
- No invite/accept flow initially — direct share
- Later: invite + accept UX

### Phase 2 — Custom Roles

- `ProjectRoleDefinition` entity (org-scoped)
- Role editor UI at `/{orgSlug}/settings/roles`
- Permission primitives formalised
- Built-in roles become seeded, uneditable records
- Transfer project ownership between entities

### Phase 3 — Advanced Collaboration

- Collab org assigns own teams to shared projects with per-project roles
- Fine-grained permission configuration per share
- Invite + accept flow for project sharing
- Cross-org audit trail

---

## 11. Migration

Prod data today: 1 org (Enopax), Felix (OWNER), Andi (MEMBER), 2 projects, no teams.

**Phase 1 migration:**
- Create `Namespace` table. Register existing org slug "Enopax" → ORGANISATION. Register user slugs for Felix and Andi → USER.
- Add `slug` field to existing User, Organisation, Project records (derive from current `name`, validate uniqueness).
- Add `ownerType: ORGANISATION` + `ownerId` to existing projects (they're all org-owned today).
- Add `visibility` to Organisation (set PUBLIC) and Project (set PRIVATE).
- Create default "All Members" team for Enopax, add Felix + Andi, grant DEVELOPER on both existing projects.
- Tiered auto-admin means Felix (OWNER) keeps full access without additional records.

**Phase 1.5 migration:** No migration — new entity, no existing data.

---

## 12. Resolved Questions

- **Q1 — Team visibility:** Permission-based. OWNER/ADMIN/MANAGER see all teams. MEMBER sees only their own teams.
- **Q2 — Empty teams:** Allowed as placeholders. No access granted.
- **Q3 — Org member removal cascade:** Deletes all TeamMember rows → removes all project access. UI warns with list of affected teams/projects.
- **Q4 — Audit log:** Log team CRUD, member add/remove, project access grant/change/revoke, project share grant/revoke.
- **Q5 — Naming (OrganisationMember vs TeamMember):** Keep both. Industry convention.
- **Q6 — Project "owner":** No separate concept. Org OWNER/ADMIN + ADMIN ProjectRole covers it.
- **Q7 — User = Org?** No. Separate entities. Shared namespace but different concepts. Users own personal projects; Orgs own org projects with teams. No `isPersonal` hack. No settings confusion.

---

## 13. References

- Research: access-control patterns across GitHub, GitLab, Notion, Linear, Figma, Jira, Azure DevOps, AWS IAM/Okta.
- Felix's scope decisions: D1=A, D2=A, D3=C, D5=shared-namespace, D6=public-default, D7=cross-entity-sharing, D8=user≠org.
- Prior: Teams stub removal (PR #54), invitation flow (PRs #58, #59, #61).
