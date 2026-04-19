/**
 * Name validation utility for organisations, projects, teams, and resources
 * Ensures names are URL-safe and don't conflict with reserved routes
 *
 * Blocked names are scoped per entity type based on actual route conflicts:
 * - Organisations live at /{orgName} — conflicts with top-level routes
 * - Projects live at /{orgName}/{projectName} — conflicts with org sub-routes
 * - Teams live at /{orgName}/teams/{teamName} — only "new" conflicts
 * - Resources live at /{orgName}/{projectName}/{resourceName} — conflicts with project sub-routes
 * - Roles are not in URLs — no restrictions
 */

export type EntityType = 'organisation' | 'project' | 'team' | 'resource';

const BLOCKED_NAMES_BY_ENTITY: Record<EntityType, Set<string>> = {
  organisation: new Set([
    'admin', 'account', 'orga', 'api', 'auth', 'login', 'logout', 'register',
    'callback', 'signin', 'signout', 'docs',
    '_next', 'static', 'favicon', 'robots', 'sitemap', 'manifest',
  ]),
  project: new Set([
    'settings', 'members', 'teams', 'roles', 'invitations', 'new',
  ]),
  team: new Set([
    'new',
  ]),
  resource: new Set([
    'settings', 'access', 'share', 'transfer', 'new',
  ]),
};

const VALID_NAME_PATTERN = /^[a-zA-Z0-9-]+$/;

export function isValidNameFormat(name: string): boolean {
  return VALID_NAME_PATTERN.test(name);
}

export function isBlockedName(name: string, entityType?: EntityType): boolean {
  const lower = name.toLowerCase();
  if (!entityType) {
    return Object.values(BLOCKED_NAMES_BY_ENTITY).some(set => set.has(lower));
  }
  return BLOCKED_NAMES_BY_ENTITY[entityType].has(lower);
}

export function validateNameFormat(
  name: string,
  entityType?: EntityType,
): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmedName = name.trim();

  if (!isValidNameFormat(trimmedName)) {
    return {
      isValid: false,
      error: 'Name can only contain letters (a-z, A-Z), numbers (0-9), and hyphens (-)',
    };
  }

  if (isBlockedName(trimmedName, entityType)) {
    return {
      isValid: false,
      error: `"${trimmedName}" is a reserved name and cannot be used`,
    };
  }

  return { isValid: true };
}
