import { v4 as uuidv4 } from "uuid";
import { Result } from "@shared/types/common";
import { RefundRecord } from "@shared/types/transaction";
import { RefundRequest } from "@shared/interfaces/payment-provisioning.interface";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";
import { AuthorizationService } from "./authorization";

/**
 * Refund processing service.
 * Validates refund eligibility and processes refund requests.
 * All refund operations produce audit trail entries.
 */
export class RefundService {
  private refunds: Map<string, RefundRecord> = new Map();
  private auditLog: IAuditLog;
  private authService: AuthorizationService;

  constructor(auditLog: IAuditLog, authService: AuthorizationService) {
    this.auditLog = auditLog;
    this.authService = authService;
  }

  async processRefund(request: RefundRequest): Promise<Result<RefundRecord>> {
    const txnResult = await this.authService.getTransaction(
      request.transactionId,
    );
    if (!txnResult.success || !txnResult.data) {
      return { success: false, error: "Transaction not found" };
    }

    const transaction = txnResult.data;
    if (
      transaction.status !== "captured" &&
      transaction.status !== "settled"
    ) {
      return {
        success: false,
        error: "Transaction must be captured or settled to refund",
      };
    }

    if (request.amount > transaction.amount) {
      return { success: false, error: "Refund amount exceeds transaction amount" };
    }

    if (transaction.merchantId !== request.merchantId) {
      return { success: false, error: "Merchant ID mismatch" };
    }

    const refundId = `REF-${uuidv4()}`;
    const now = new Date().toISOString();

    const refund: RefundRecord = {
      refundId,
      transactionId: request.transactionId,
      merchantId: request.merchantId,
      amount: request.amount,
      reason: request.reason,
      status: "processed",
      createdAt: now,
      processedAt: now,
    };

    this.refunds.set(refundId, refund);
    await this.authService.updateTransactionStatus(
      request.transactionId,
      "refunded",
    );

    await this.auditLog.log({
      actor: "payments-refund",
      action: "refund_processed",
      domain: "payments",
      resourceType: "refund",
      resourceId: refundId,
      details: `Refund processed for transaction ${request.transactionId}`,
      outcome: "success",
    });

    return { success: true, data: refund };
  }
}
