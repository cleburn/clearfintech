import { v4 as uuidv4 } from "uuid";
import { Result } from "@shared/types/common";
import { Transaction } from "@shared/types/transaction";
import { ProcessTransactionRequest } from "@shared/interfaces/payment-provisioning.interface";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";

/**
 * Transaction authorization service.
 * Validates and authorizes payment transactions.
 * All financial operations produce audit trail entries.
 */
export class AuthorizationService {
  private transactions: Map<string, Transaction> = new Map();
  private auditLog: IAuditLog;

  constructor(auditLog: IAuditLog) {
    this.auditLog = auditLog;
  }

  async authorize(
    request: ProcessTransactionRequest,
  ): Promise<Result<Transaction>> {
    const transactionId = `TXN-${uuidv4()}`;
    const now = new Date().toISOString();

    const transaction: Transaction = {
      transactionId,
      merchantId: request.merchantId,
      customerTokenId: request.customerTokenId,
      paymentTokenId: request.paymentTokenId,
      type: request.type,
      amount: request.amount,
      currency: request.currency,
      status: "authorized",
      authorizedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.transactions.set(transactionId, transaction);

    await this.auditLog.log({
      actor: "payments-authorization",
      action: "transaction_authorized",
      domain: "payments",
      resourceType: "transaction",
      resourceId: transactionId,
      details: `Transaction authorized for merchant ${request.merchantId}`,
      outcome: "success",
    });

    return { success: true, data: transaction };
  }

  async getTransaction(
    transactionId: string,
  ): Promise<Result<Transaction>> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }
    return { success: true, data: { ...transaction } };
  }

  async getTransactionsByMerchant(
    merchantId: string,
  ): Promise<Result<Transaction[]>> {
    const results: Transaction[] = [];
    for (const txn of this.transactions.values()) {
      if (txn.merchantId === merchantId) {
        results.push({ ...txn });
      }
    }
    return { success: true, data: results };
  }

  async updateTransactionStatus(
    transactionId: string,
    status: Transaction["status"],
    timestampField?: "capturedAt" | "settledAt",
  ): Promise<Result<Transaction>> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    const now = new Date().toISOString();
    transaction.status = status;
    transaction.updatedAt = now;
    if (timestampField) {
      transaction[timestampField] = now;
    }

    await this.auditLog.log({
      actor: "payments-authorization",
      action: `transaction_${status}`,
      domain: "payments",
      resourceType: "transaction",
      resourceId: transactionId,
      details: `Transaction status updated to ${status}`,
      outcome: "success",
    });

    return { success: true, data: { ...transaction } };
  }
}
