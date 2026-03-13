import { Result } from "../types/common";
import { MerchantTier, MerchantAccount } from "../types/merchant";
import { Transaction, RefundRecord, SettlementBatch } from "../types/transaction";

/**
 * Cross-domain interface for payment operations.
 * Financial data is handled through typed contracts.
 * Raw card numbers and bank details never appear in this interface.
 */
export interface IPaymentProvisioning {
  provisionMerchantAccount(
    request: ProvisionAccountRequest,
  ): Promise<Result<MerchantAccount>>;

  processTransaction(
    request: ProcessTransactionRequest,
  ): Promise<Result<Transaction>>;

  getTransaction(
    transactionId: string,
  ): Promise<Result<Transaction>>;

  getTransactionsByMerchant(
    merchantId: string,
  ): Promise<Result<Transaction[]>>;

  processRefund(request: RefundRequest): Promise<Result<RefundRecord>>;

  createSettlementBatch(
    merchantId: string,
    transactionIds: string[],
  ): Promise<Result<SettlementBatch>>;
}

export interface ProvisionAccountRequest {
  applicationId: string;
  businessName: string;
  tier: MerchantTier;
}

export interface ProcessTransactionRequest {
  merchantId: string;
  customerTokenId: string;
  paymentTokenId: string;
  amount: number;
  currency: string;
  type: "credit_card" | "debit_card" | "ach";
}

export interface RefundRequest {
  transactionId: string;
  merchantId: string;
  amount: number;
  reason: string;
}
