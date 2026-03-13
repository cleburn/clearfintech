import { Result } from "@shared/types/common";
import { Transaction } from "@shared/types/transaction";
import { IPaymentProvisioning } from "@shared/interfaces/payment-provisioning.interface";

/**
 * Transaction view service for the dashboard.
 * Displays transaction data retrieved through shared interfaces.
 * No access to raw financial data or card/bank details.
 */

export interface TransactionSummary {
  transactionId: string;
  customerTokenId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export class TransactionViewService {
  private paymentService: IPaymentProvisioning;

  constructor(paymentService: IPaymentProvisioning) {
    this.paymentService = paymentService;
  }

  async getMerchantTransactions(
    merchantId: string,
  ): Promise<Result<TransactionSummary[]>> {
    const result =
      await this.paymentService.getTransactionsByMerchant(merchantId);

    if (!result.success || !result.data) {
      return { success: false, error: "Failed to retrieve transactions" };
    }

    const summaries: TransactionSummary[] = result.data.map(
      (txn: Transaction) => ({
        transactionId: txn.transactionId,
        customerTokenId: txn.customerTokenId,
        type: txn.type,
        amount: txn.amount,
        currency: txn.currency,
        status: txn.status,
        createdAt: txn.createdAt,
      }),
    );

    return { success: true, data: summaries };
  }

  async getTransactionDetail(
    transactionId: string,
  ): Promise<Result<TransactionSummary>> {
    const result = await this.paymentService.getTransaction(transactionId);

    if (!result.success || !result.data) {
      return { success: false, error: "Transaction not found" };
    }

    const txn = result.data;
    return {
      success: true,
      data: {
        transactionId: txn.transactionId,
        customerTokenId: txn.customerTokenId,
        type: txn.type,
        amount: txn.amount,
        currency: txn.currency,
        status: txn.status,
        createdAt: txn.createdAt,
      },
    };
  }
}
