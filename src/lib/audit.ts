
// TODO: Phase 4 — migrate cross-org audit events to a dedicated audit log table
// with extended entityType support (project-share, project-access, project-transfer).
// For now, cross-org audit events are written to console with a structured format.

export interface AuditEvent {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, string>;
}

export function logAudit(event: AuditEvent): void {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  console.log('[AUDIT]', JSON.stringify(entry));
}
