import { v4 as uuidv4 } from "uuid";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";

/**
 * SAR (Suspicious Activity Report) filing service.
 *
 * RESTRICTED: This module handles the most sensitive data in the system.
 * - SAR filing data never leaves the compliance domain
 * - SAR existence/status is restricted information under federal law
 * - FinCEN filing content never crosses domain boundaries
 * - Nothing from this module is exposed through shared interfaces
 */

interface SarRecord {
  sarId: string;
  merchantId: string;
  reason: string;
  filedAt: string;
  status: "pending" | "filed" | "acknowledged";
}

export class SarFilingService {
  private filings: SarRecord[] = [];
  private auditLog: IAuditLog;

  constructor(auditLog: IAuditLog) {
    this.auditLog = auditLog;
  }

  async fileSar(merchantId: string, reason: string): Promise<string> {
    const sarId = `SAR-${uuidv4()}`;

    const record: SarRecord = {
      sarId,
      merchantId,
      reason,
      filedAt: new Date().toISOString(),
      status: "pending",
    };

    this.filings.push(record);

    await this.auditLog.log({
      actor: "sar-filing",
      action: "sar_filed",
      domain: "compliance",
      resourceType: "sar",
      resourceId: sarId,
      details: "SAR filing created within compliance domain",
      outcome: "success",
    });

    return sarId;
  }

  async updateStatus(
    sarId: string,
    status: "filed" | "acknowledged",
  ): Promise<boolean> {
    const record = this.filings.find((f) => f.sarId === sarId);
    if (!record) {
      return false;
    }

    record.status = status;

    await this.auditLog.log({
      actor: "sar-filing",
      action: "sar_status_updated",
      domain: "compliance",
      resourceType: "sar",
      resourceId: sarId,
      details: "SAR filing status updated within compliance domain",
      outcome: "success",
    });

    return true;
  }

  getFilingCount(): number {
    return this.filings.length;
  }
}
