export type TransactionStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "settled"
  | "refunded"
  | "declined"
  | "failed"
  | "chargeback";

export type TransactionType = "credit_card" | "debit_card" | "ach";

export type RefundStatus = "pending" | "processed" | "failed";

export interface Transaction {
  transactionId: string;
  merchantId: string;
  customerTokenId: string;
  paymentTokenId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  authorizedAt?: string;
  capturedAt?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRecord {
  refundId: string;
  transactionId: string;
  merchantId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
  processedAt?: string;
}

export interface SettlementBatch {
  batchId: string;
  merchantId: string;
  transactionIds: string[];
  totalAmount: number;
  currency: string;
  status: "pending" | "processing" | "settled" | "failed";
  createdAt: string;
  settledAt?: string;
}
