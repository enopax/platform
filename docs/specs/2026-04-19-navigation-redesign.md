# Navigation Redesign

**Date**: 2026-04-19
**Status**: Approved

## Overview

Unify the platform's navigation into a single top nav bar and a single context-aware sidebar. Remove the org selector dropdown — org switching happens via the Organisations overview page or the command palette. Current org is persisted in localStorage.

---

## Top Nav Bar

Replaces the current `UserBar` component. Always visible on all authenticated pages.

**Layout**: `[ Hamburger | Breadcrumb + Visibility badge | ---- gap ---- | Search | User avatar ]`

### Left side (left-aligned)

1. **Hamburger menu** (mobile: toggles sidebar, desktop: always visible for consistency or hidden — matches current `lg:hidden` pattern for mobile)
2. **Breadcrumb path** — context-aware:
   - Org-level pages: `Enopax`
   - Project-level pages: `Enopax / ResourceTest`
   - Each segment is a clickable link
3. **Visibility badge** — `Private` or `Public` pill next to the breadcrumb (for projects/resources that have a visibility flag)

### Right side (right-aligned)

4. **Smart Search** — triggers the existing CommandPalette (`cmd+K`). Styled as a search input placeholder: `Search or jump to... ⌘K`
5. **User avatar** — links to user profile/settings. Existing `UserBarMenu` dropdown behaviour (Sign Out, Account, Admin links)

### What's removed from top nav

- Version number (`v0.4.1`)
- The `E` logo
- The hamburger menu icon from `UserBarMenu` (menu items move into sidebar or stay in avatar dropdown)

---

## Sidebar

Replaces both `SidebarNavigation` and `OrgSidebar` with a single unified sidebar. Content is context-aware based on the current page.

### On org-level pages

Pages: Overview, Members, Teams, Roles, Invitations, Settings, teams/new, roles/new, etc.

```
┌─────────────────────┐
│ ORGANISATION        │
│  Overview           │
│  Members            │
│  Teams              │
│  Roles              │
│  Invitations        │
│  Settings           │
│                     │
│ PROJECTS            │
│  ResourceTest       │
│  Resource-Tests     │
└─────────────────────┘
```

- Show org navigation items
- Show project list below (clickable to navigate into project)
- **Exception**: on the org Overview page (which already shows projects as its main content), hide the PROJECTS section to avoid duplication

### On project-level pages

Pages: Resources, Access, Share, Transfer, Settings (under `/{orgName}/{projectName}/...`)

```
┌─────────────────────┐
│ PROJECT             │
│  Resources    ← active
│  Access             │
│  Share              │
│  Transfer           │
│  Settings           │
│─────────────────────│
│ ORGANISATION        │
│  Overview           │
│  Members            │
│  Teams              │
│  Roles              │
│  Invitations        │
│  Settings           │
└─────────────────────┘
```

- Context section (project actions) on top
- Org navigation below the divider
- No project list (you're already in a project; use breadcrumb or back to overview)

### On non-org pages

Pages: `/account/settings`, `/account/developer`, `/admin/*`

- Sidebar shows account or admin navigation as it currently does
- No org/project sections

---

## Org Persistence

- Current org saved to `localStorage` key (e.g. `enopax:current-org`)
- When navigating to `/orga` or the root authenticated page, redirect to the saved org if one exists
- Updated whenever the user navigates into an org
- Org overview page (`/orga`) always accessible from the user menu dropdown or command palette

---

## Components Affected

### New/Modified

| Component | Change |
|-----------|--------|
| `UserBar` | Rewrite — becomes the top nav bar with breadcrumb, search, user avatar |
| `OrgSidebar` | Delete — merged into unified sidebar |
| `SidebarNavigation` | Rewrite — becomes context-aware unified sidebar |
| `MobileNavigation` | Update — align with new sidebar content, hamburger in top nav |
| `UserBarMenu` | Simplify — avatar + dropdown only (no hamburger icon) |

### Removed

| Component | Reason |
|-----------|--------|
| `OrgSidebar` | Merged into `SidebarNavigation` |
| Org selector dropdown (in `SidebarNavigation`) | Replaced by localStorage persistence + org overview page |

### Unchanged

| Component | Reason |
|-----------|--------|
| `CommandPalette` | Reused as-is, triggered from top nav search |
| `CommandPaletteProvider` | No changes |

---

## Breadcrumb Logic

The top nav breadcrumb is derived from the URL pathname and current context:

| URL pattern | Breadcrumb |
|-------------|------------|
| `/{orgName}` | `Enopax` |
| `/{orgName}/members` | `Enopax` |
| `/{orgName}/teams/new` | `Enopax` |
| `/{orgName}/{projectName}` | `Enopax / ResourceTest` |
| `/{orgName}/{projectName}/settings` | `Enopax / ResourceTest` |
| `/account/settings` | (no breadcrumb) |
| `/admin/users` | (no breadcrumb) |

---

## Mobile Behaviour

- Hamburger in top nav toggles sidebar as a slide-in drawer (existing pattern)
- Top nav always visible
- Sidebar content identical to desktop — just presented as an overlay
- Search triggers command palette (same as desktop)

---

## Out of Scope

- Changing the command palette functionality
- Changing page content or layouts
- Changing the route structure
- Adding new pages
