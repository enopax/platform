# Access Control Design — Organisations, Teams, Projects, Roles

**Date:** 2026-04-15 (updated 2026-04-16)
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

- **Teams** are the single mechanism for project access (no direct individual grants)
- **Cross-org collaboration** replaces "external members" — every user IS an org (personal namespace), sharing a project with an external person = sharing with their org
- **Slugs + display names** everywhere, shared global namespace
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

**Slug rules:** lowercase alphanumeric + hyphens, 2-39 chars, no leading/trailing hyphens, no consecutive hyphens. Same rules as GitHub.

### Shared global namespace

User slugs and Org slugs share the same pool — like GitHub where `github.com/felixboehm` and `github.com/enopax` coexist.

**URLs:**
```
enopax.com/enopax/platform        ← org project
enopax.com/felixboehm/experiment  ← personal project
enopax.com/enopax/members         ← org members page
enopax.com/felixboehm/settings    ← personal settings (same as account)
```

**Reserved slugs:** `account`, `admin`, `signin`, `register`, `accept-invite`, `api`, `_next`, `assets`, `icons`, `settings`, `new`, `explore`

**Uniqueness:** on user registration or org creation, check the global slug table. Conflict → "this name is taken."

### Personal namespace = auto-org

Every user gets a personal Organisation auto-created at registration:
- `slug` = user's slug, `name` = user's display name
- `isPersonal: true` flag — UI shows "My Projects" instead of org chrome
- User is auto-OWNER, cannot leave or delete (tied to account lifecycle)
- Same entity, same permissions, same Team/Project model — just a UI distinction

This means: **there is no concept of "external user."** An external person is just another org (their personal namespace or their company org) that gets cross-org project access. One mechanism for everything.

---

## 3. Decisions

| # | Question | Decision | Rationale |
|---|---|---|---|
| D1 | Team-only vs direct project members? | **Teams only** | No micro-managing. External access = cross-org sharing (see §6). |
| D2 | Scope of custom roles? | **Org-level, reused across projects** | Start with built-in project roles; custom roles Phase 2. |
| D3 | How do org-roles and project-team-roles combine? | **Tiered**: OWNER + ADMIN auto-admin on every project; MANAGER + MEMBER only via team | Least privilege + trust tier. Explicit in UI. |
| D5 | Namespace model? | **Shared global namespace**, user = personal org | GitHub model. One URL space, one mechanism for personal + org projects. |
| D6 | Default org visibility? | **Public** | Discoverable by default. Admins can switch to private. |
| D7 | Cross-org = external members? | **Yes** | `felixboehm` user = `felixboehm` org. Sharing with a person = sharing with their org. No separate external-member concept. |

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
| `PUBLIC` | Anyone (even unauthenticated) can see description + resource status. Write/deploy still requires team access. |
| `INTERNAL` | All org members can view (regardless of team assignment). Write/deploy requires team access. |
| `PRIVATE` | Only teams with ProjectAccess + tiered auto-admin (OWNER/ADMIN) can see it. Default for new projects. |

**Org-level default:** setting on Organisation: `defaultProjectVisibility: PRIVATE | INTERNAL | PUBLIC`.

---

## 5. Domain Model

### Entities

```
User
  id, slug, name, email, password, createdAt, ...
  — slug is globally unique (shared namespace with orgs)

Organisation
  id, slug, name, description
  visibility: PUBLIC | PRIVATE
  defaultProjectVisibility: PRIVATE | INTERNAL | PUBLIC
  isPersonal: boolean  — true for auto-created personal namespaces
  ownerId
  createdAt, updatedAt
  — slug is globally unique (shared namespace with users)

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
  id, organisationId, slug, name, description
  visibility: PUBLIC | INTERNAL | PRIVATE
  status, isActive, ...
  — slug unique within parent org

ProjectAccess
  id, projectId, teamId
  role: ProjectRole (see §7)
  grantedAt, grantedBy
  — role stored explicitly. UI pre-fills from team.defaultProjectRole;
    admin can change. No "use default" indirection.

ProjectShare (Phase 1.5 — cross-org)
  id, projectId
  sharedWithOrgId
  permission: VIEW | CONTRIBUTE | MANAGE
  sharedBy, sharedAt
  — Simple sharing: host org shares project with another org.
  — Collab org sees it in a "Shared with you" section.
  — Permission controls what the collab org's teams can do (see §6).
  — No invite/accept flow initially — admin shares directly.
    Later: invite + accept UX.

(Phase 2)
ProjectRoleDefinition
  id, organisationId, name, description, permissions
  isBuiltIn: boolean
  — Team.defaultProjectRole and ProjectAccess.role become references
    to this entity instead of a fixed enum.
```

### Relationships

```
User ←slug→ global namespace ←slug→ Organisation
Organisation 1..N OrganisationMember
Organisation 1..N Team
Team 1..N TeamMember (users)
Organisation 1..N Project
Project 1..N ProjectAccess (team + role)
Project 0..N ProjectShare (cross-org, Phase 1.5)
```

### Invariants

- User.slug and Organisation.slug share the same uniqueness constraint (global slug table).
- A Team belongs to exactly one Organisation.
- In MVP, all TeamMembers must also be OrganisationMembers of the same org.
- Removing an OrganisationMember cascades: deletes all their TeamMember rows (and thus all project access). UI warns before confirming.
- Removing a Team cascades to its ProjectAccess rows.
- Removing a Project cascades to its ProjectAccess + ProjectShare rows.
- Personal orgs (isPersonal: true) cannot be deleted independently — tied to user account lifecycle.

---

## 6. Cross-Org Collaboration (Phase 1.5)

### Core insight

**There are no "external members."** Every user has a personal org. Sharing a project with external person Felix = sharing with org `felixboehm`. Sharing with company Acme = sharing with org `acme`. Same mechanism.

### How it works

1. Host org admin shares Project X with Org B: creates a `ProjectShare` row.
2. Org B sees Project X in their "Shared with you" section.
3. `ProjectShare.permission` controls what Org B can do:

| Permission | What collab org can do |
|---|---|
| `VIEW` | See project metadata + resource status. Read-only. |
| `CONTRIBUTE` | VIEW + use/manage resources within the project. Cannot change project settings or team access. |
| `MANAGE` | CONTRIBUTE + manage project settings and share with other orgs (but cannot delete project — only host org can). |

4. **Host org has final say:** delete, rename, change billing, revoke shares.

### What collab org CANNOT do (Phase 1.5)

- Cannot assign their own teams to the shared project (that's Phase 2+)
- Cannot change the share permission level (only host org admin can)
- Cannot re-share with a third org (unless permission = MANAGE)

### Later improvements

- Invite + accept flow (instead of direct share)
- Collab org assigns their own teams with per-project roles
- Configurable fine-grained permissions per share

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

1. **Tiered auto-admin:** If `U` is OWNER or ADMIN in the parent org → ADMIN on `P`.
2. **Team grants:** Collect every ProjectAccess where `P` = project and `U` ∈ team. Effective role = highest of all.
3. **Cross-org share (Phase 1.5):** If `U` is a member of a collab org that has a ProjectShare on `P`, effective permission = the share's permission level (VIEW / CONTRIBUTE / MANAGE), mapped to the closest ProjectRole.
4. **Visibility fallback:** If `P` is INTERNAL and `U` is an org member → implicit VIEWER. If `P` is PUBLIC → implicit VIEWER for everyone.
5. **No grant:** `P` doesn't appear in `U`'s navigation.

**Rules:** Union-of-all-grants. No deny. No team nesting. Most permissive wins.

### Visibility in UI

On a project's access page, surface **why** each user has access:
- "Alice — Admin via Org OWNER role"
- "Bob — Developer via Team Backend"
- "Charlie — Viewer via Org Acme (shared)"

---

## 8. GitHub Comparison

### What we adopt from GitHub

| GitHub concept | Enopax equivalent |
|---|---|
| User + personal repos | User + personal org (auto-created) |
| Organisation | Organisation |
| Repository | Project |
| Team → repo permission | Team → ProjectAccess(role) |
| Org Owner / Member | OWNER / ADMIN / MANAGER / MEMBER |
| Public / private repos | Public / internal / private projects |
| Public / hidden org membership | Public / private orgs |
| Slug-based URLs | `enopax.com/{slug}/{project}` |
| Slug + display name | Same — both everywhere |
| Reserved paths | Same approach |

### Where we improve on GitHub

1. **One access path** — GitHub has Teams AND direct collaborators. Confusing. We have Teams only (D1).
2. **Team character** — `defaultProjectRole` on Team. GitHub teams are generic.
3. **Real cross-org** — GitHub can't share a repo between two orgs. Only fork (copy) or transfer (move). We support true shared projects.
4. **Transparent access traces** — "Admin via Org OWNER" in the project member view. GitHub hides implicit permissions.
5. **INTERNAL visibility** — all org members can read without explicit team assignment. GitHub Enterprise has this but it's buried.

### What we consciously skip

- **Nested teams** — GitHub supports parent/child teams. Adds complexity, rarely used. We keep teams flat.
- **Template projects** — Not in scope. May revisit later.
- **Forking** — Our cross-org model is sharing (same project), not copying. Forking may come later if use cases emerge.

---

## 9. UX Implications

### URL structure (flat namespace)

```
/{slug}                      → org or personal namespace overview
/{slug}/{project}            → project overview
/{slug}/members              → org member management
/{slug}/teams                → team management
/{slug}/teams/{teamSlug}     → team detail + members
/{slug}/{project}/access     → project team access management
/{slug}/{project}/members    → derived effective member view
/{slug}/{project}/settings   → project settings
/{slug}/settings             → org settings
```

### Navigation

- Left sidebar shows: personal namespace ("My Projects") + all orgs the user is a member of + "Shared with you" section (Phase 1.5)
- Within an org: projects list filtered by team access (unless OWNER/ADMIN → see all)
- Project detail: tabs for Overview, Resources, Access, Members, Settings

### Key flows

- **Create team:** `/enopax/teams` → "New Team" → name + description + default role → done
- **Add team to project:** `/enopax/platform/access` → "Add Team" → pick team → role pre-filled from team default → confirm
- **Share project cross-org:** `/enopax/platform/settings` → "Share with Organisation" → enter org slug → pick permission (VIEW/CONTRIBUTE/MANAGE) → done
- **Accept shared project:** appears in collab org's "Shared with you" automatically (no invite flow in Phase 1.5)

---

## 10. Phased Roadmap

### Phase 1 — Teams + Visibility + Slugs (MVP)

- Entities: `Team`, `TeamMember`, `ProjectAccess`
- `slug` + `name` on User, Organisation, Project
- Global slug uniqueness (shared namespace)
- `visibility` on Organisation (PUBLIC/PRIVATE, default PUBLIC) and Project (PUBLIC/INTERNAL/PRIVATE)
- `isPersonal` on Organisation + auto-create on user registration
- Built-in project roles (VIEWER / DEVELOPER / DEPLOYER / ADMIN)
- Team CRUD pages, project access page, derived member view
- Permission resolution helper
- Flat URL routing (`/{slug}/{project}`)
- Archive project (`status: ARCHIVED` — read-only, preserved)

### Phase 1.5 — Cross-Org Sharing

- `ProjectShare` entity
- Simple sharing: admin shares project with another org, picks permission level
- Collab org sees shared projects in "Shared with you" section
- No invite/accept flow — direct share (admin to admin)
- Later: invite + accept UX, collab org assigns own teams

### Phase 2 — Custom Roles

- `ProjectRoleDefinition` entity (org-scoped)
- Role editor UI
- Permission primitives formalised
- Built-in roles become seeded, uneditable records
- Transfer project ownership between orgs

### Phase 3 — Advanced Collaboration

- Collab org assigns own teams to shared projects with per-project roles
- Fine-grained permission configuration per share
- Invite + accept flow for project sharing
- Cross-org audit trail

---

## 11. Migration

Prod data today: 1 org (Enopax), Felix (OWNER), Andi (MEMBER), 2 projects, no teams.

**Phase 1 migration:**
- Add `slug` field to existing User, Organisation, Project records (derive from current `name`, validate uniqueness)
- Add `visibility` to Organisation (set PUBLIC) and Project (set PRIVATE)
- Add `isPersonal: false` to existing Enopax org
- Create personal orgs for Felix and Andi (`isPersonal: true`)
- Create default "All Members" team for Enopax, add Felix + Andi, grant DEVELOPER on both existing projects
- Tiered auto-admin means Felix (OWNER) keeps full access without additional records

**Phase 1.5 migration:** No migration — new entity, no existing data.

---

## 12. Resolved Questions

- **Q1 — Team visibility:** Permission-based. OWNER/ADMIN/MANAGER see all teams. MEMBER sees only their own teams.
- **Q2 — Empty teams:** Allowed as placeholders. No access granted.
- **Q3 — Org member removal cascade:** Deletes all TeamMember rows → removes all project access. UI warns with list of affected teams/projects.
- **Q4 — Audit log:** Log team CRUD, member add/remove, project access grant/change/revoke.
- **Q5 — Naming (OrganisationMember vs TeamMember):** Keep both. Industry convention.
- **Q6 — Project "owner":** No separate concept. Org OWNER/ADMIN + ADMIN ProjectRole covers it.

---

## 13. References

- Research: access-control patterns across GitHub, GitLab, Notion, Linear, Figma, Jira, Azure DevOps, AWS IAM/Okta.
- Felix's scope decisions: D1=A, D2=A, D3=C, D5=shared-namespace, D6=public-default, D7=cross-org-is-external.
- Prior: Teams stub removal (PR #54), invitation flow (PRs #58, #59, #61).
