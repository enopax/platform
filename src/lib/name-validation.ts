/**
 * Name validation utility for organisations, projects, teams, and resources
 * Ensures names are URL-safe and don't conflict with reserved routes
 */

import blockedNamesConfig from './constants/blocked-names.json';

const BLOCKED_NAMES = new Set(
  blockedNamesConfig.blockedNames.map(name => name.toLowerCase())
);

/**
 * Regex pattern for valid URL-safe characters
 * Allows: a-z, A-Z, 0-9, hyphens (-)
 */
const VALID_NAME_PATTERN = /^[a-zA-Z0-9-]+$/;

/**
 * Validates that a name contains only URL-safe characters
 * @param name - The name to validate
 * @returns true if the name contains only valid characters
 */
export function isValidNameFormat(name: string): boolean {
  return VALID_NAME_PATTERN.test(name);
}

/**
 * Checks if a name is in the blocked names list (case-insensitive)
 * @param name - The name to check
 * @returns true if the name is blocked
 */
export function isBlockedName(name: string): boolean {
  return BLOCKED_NAMES.has(name.toLowerCase());
}

/**
 * Comprehensive validation for entity names
 * Checks both character format and blocked names
 * @param name - The name to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateNameFormat(name: string): { isValid: boolean; error?: string } {
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

  if (isBlockedName(trimmedName)) {
    return {
      isValid: false,
      error: `"${trimmedName}" is a reserved name and cannot be used`,
    };
  }

  return { isValid: true };
}
