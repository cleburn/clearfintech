import { v4 as uuidv4 } from "uuid";
import { Result } from "@shared/types/common";
import { SettlementBatch } from "@shared/types/transaction";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";
import { AuthorizationService } from "./authorization";

/**
 * Settlement service. Creates and processes settlement batches.
 * All settlement operations produce audit trail entries.
 */
export class SettlementService {
  private batches: Map<string, SettlementBatch> = new Map();
  private auditLog: IAuditLog;
  private authService: AuthorizationService;

  constructor(auditLog: IAuditLog, authService: AuthorizationService) {
    this.auditLog = auditLog;
    this.authService = authService;
  }

  async createBatch(
    merchantId: string,
    transactionIds: string[],
  ): Promise<Result<SettlementBatch>> {
    let totalAmount = 0;
    let currency = "USD";

    for (const txnId of transactionIds) {
      const result = await this.authService.getTransaction(txnId);
      if (!result.success || !result.data) {
        return { success: false, error: `Transaction ${txnId} not found` };
      }
      if (result.data.status !== "captured") {
        return {
          success: false,
          error: `Transaction ${txnId} must be captured before settlement`,
        };
      }
      totalAmount += result.data.amount;
      currency = result.data.currency;
    }

    const batchId = `BATCH-${uuidv4()}`;
    const batch: SettlementBatch = {
      batchId,
      merchantId,
      transactionIds,
      totalAmount,
      currency,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.batches.set(batchId, batch);

    await this.auditLog.log({
      actor: "payments-settlement",
      action: "settlement_batch_created",
      domain: "payments",
      resourceType: "settlement_batch",
      resourceId: batchId,
      details: `Settlement batch created with ${transactionIds.length} transactions`,
      outcome: "success",
    });

    return { success: true, data: batch };
  }

  async processBatch(batchId: string): Promise<Result<SettlementBatch>> {
    const batch = this.batches.get(batchId);
    if (!batch) {
      return { success: false, error: "Settlement batch not found" };
    }

    batch.status = "processing";

    for (const txnId of batch.transactionIds) {
      await this.authService.updateTransactionStatus(
        txnId,
        "settled",
        "settledAt",
      );
    }

    batch.status = "settled";
    batch.settledAt = new Date().toISOString();

    await this.auditLog.log({
      actor: "payments-settlement",
      action: "settlement_batch_settled",
      domain: "payments",
      resourceType: "settlement_batch",
      resourceId: batchId,
      details: `Settlement batch processed: ${batch.transactionIds.length} transactions settled`,
      outcome: "success",
    });

    return { success: true, data: { ...batch } };
  }
}
