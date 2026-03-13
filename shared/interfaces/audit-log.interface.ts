import { AuditEntry, Result } from "../types/common";

/**
 * Cross-domain interface for audit trail operations.
 * Every operation touching financial data or PII must log through this interface.
 * Audit entries are immutable once written.
 */
export interface IAuditLog {
  log(entry: AuditLogRequest): Promise<Result<AuditEntry>>;

  getEntriesByResource(
    resourceType: string,
    resourceId: string,
  ): Promise<Result<AuditEntry[]>>;

  getEntriesByActor(actor: string): Promise<Result<AuditEntry[]>>;

  getEntriesByDomain(domain: string): Promise<Result<AuditEntry[]>>;
}

export interface AuditLogRequest {
  actor: string;
  action: string;
  domain: string;
  resourceType: string;
  resourceId: string;
  details: string;
  outcome: "success" | "failure" | "denied";
}
