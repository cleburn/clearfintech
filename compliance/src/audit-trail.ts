import { v4 as uuidv4 } from "uuid";
import { AuditEntry, Result } from "@shared/types/common";
import { IAuditLog, AuditLogRequest } from "@shared/interfaces/audit-log.interface";

/**
 * Immutable audit trail. Entries cannot be modified or deleted after creation.
 * Every operation touching financial data or PII must have a corresponding entry.
 * SOX compliance: complete, immutable audit trail for all financial operations.
 */
export class AuditTrail implements IAuditLog {
  private entries: AuditEntry[] = [];

  async log(request: AuditLogRequest): Promise<Result<AuditEntry>> {
    const entry: AuditEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      actor: request.actor,
      action: request.action,
      domain: request.domain,
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      details: request.details,
      outcome: request.outcome,
    };

    this.entries.push(Object.freeze(entry));

    return { success: true, data: entry };
  }

  async getEntriesByResource(
    resourceType: string,
    resourceId: string,
  ): Promise<Result<AuditEntry[]>> {
    const filtered = this.entries.filter(
      (e) => e.resourceType === resourceType && e.resourceId === resourceId,
    );
    return { success: true, data: filtered };
  }

  async getEntriesByActor(actor: string): Promise<Result<AuditEntry[]>> {
    const filtered = this.entries.filter((e) => e.actor === actor);
    return { success: true, data: filtered };
  }

  async getEntriesByDomain(domain: string): Promise<Result<AuditEntry[]>> {
    const filtered = this.entries.filter((e) => e.domain === domain);
    return { success: true, data: filtered };
  }

  getEntryCount(): number {
    return this.entries.length;
  }

  getAllEntries(): ReadonlyArray<AuditEntry> {
    return [...this.entries];
  }
}
