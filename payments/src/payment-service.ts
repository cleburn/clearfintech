import { v4 as uuidv4 } from "uuid";
import { Result } from "@shared/types/common";
import { Transaction, RefundRecord, SettlementBatch } from "@shared/types/transaction";
import { MerchantAccount } from "@shared/types/merchant";
import {
  IPaymentProvisioning,
  ProvisionAccountRequest,
  ProcessTransactionRequest,
  RefundRequest,
} from "@shared/interfaces/payment-provisioning.interface";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";
import { AuthorizationService } from "./authorization";
import { SettlementService } from "./settlement";
import { RefundService } from "./refund";

/**
 * Unified payment service implementing the shared payment provisioning interface.
 * Coordinates authorization, settlement, and refund operations.
 * All operations produce audit trail entries.
 */
export class PaymentService implements IPaymentProvisioning {
  private merchantAccounts: Map<string, MerchantAccount> = new Map();
  private authService: AuthorizationService;
  private settlementService: SettlementService;
  private refundService: RefundService;
  private auditLog: IAuditLog;

  constructor(auditLog: IAuditLog) {
    this.auditLog = auditLog;
    this.authService = new AuthorizationService(auditLog);
    this.settlementService = new SettlementService(auditLog, this.authService);
    this.refundService = new RefundService(auditLog, this.authService);
  }

  async provisionMerchantAccount(
    request: ProvisionAccountRequest,
  ): Promise<Result<MerchantAccount>> {
    const merchantId = `MER-${uuidv4()}`;
    const now = new Date().toISOString();

    const account: MerchantAccount = {
      merchantId,
      applicationId: request.applicationId,
      businessName: request.businessName,
      tier: request.tier,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.merchantAccounts.set(merchantId, account);

    await this.auditLog.log({
      actor: "payments-provisioning",
      action: "merchant_account_provisioned",
      domain: "payments",
      resourceType: "merchant_account",
      resourceId: merchantId,
      details: `Merchant account provisioned: ${request.businessName} (${request.tier})`,
      outcome: "success",
    });

    return { success: true, data: account };
  }

  async processTransaction(
    request: ProcessTransactionRequest,
  ): Promise<Result<Transaction>> {
    return this.authService.authorize(request);
  }

  async getTransaction(
    transactionId: string,
  ): Promise<Result<Transaction>> {
    return this.authService.getTransaction(transactionId);
  }

  async getTransactionsByMerchant(
    merchantId: string,
  ): Promise<Result<Transaction[]>> {
    return this.authService.getTransactionsByMerchant(merchantId);
  }

  async processRefund(request: RefundRequest): Promise<Result<RefundRecord>> {
    return this.refundService.processRefund(request);
  }

  async createSettlementBatch(
    merchantId: string,
    transactionIds: string[],
  ): Promise<Result<SettlementBatch>> {
    return this.settlementService.createBatch(merchantId, transactionIds);
  }

  async captureTransaction(
    transactionId: string,
  ): Promise<Result<Transaction>> {
    return this.authService.updateTransactionStatus(
      transactionId,
      "captured",
      "capturedAt",
    );
  }

  async settleTransaction(
    transactionId: string,
  ): Promise<Result<Transaction>> {
    return this.authService.updateTransactionStatus(
      transactionId,
      "settled",
      "settledAt",
    );
  }
}
