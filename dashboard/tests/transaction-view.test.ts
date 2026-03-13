import { TransactionViewService } from "../src/transaction-view";
import { IPaymentProvisioning } from "@shared/interfaces/payment-provisioning.interface";
import { Transaction } from "@shared/types/transaction";

const sampleTransaction: Transaction = {
  transactionId: "TXN-dash-001",
  merchantId: "MER-001",
  customerTokenId: "CTK-dash-001",
  paymentTokenId: "PTK-dash-001",
  type: "credit_card",
  amount: 99.99,
  currency: "USD",
  status: "settled",
  authorizedAt: "2024-12-15T10:00:00.000Z",
  capturedAt: "2024-12-15T10:01:00.000Z",
  settledAt: "2024-12-15T12:00:00.000Z",
  createdAt: "2024-12-15T10:00:00.000Z",
  updatedAt: "2024-12-15T12:00:00.000Z",
};

function createMockPaymentService(
  transactions: Transaction[] = [],
): IPaymentProvisioning {
  return {
    provisionMerchantAccount: jest.fn(),
    processTransaction: jest.fn(),
    getTransaction: jest.fn().mockResolvedValue({
      success: true,
      data: transactions[0],
    }),
    getTransactionsByMerchant: jest.fn().mockResolvedValue({
      success: true,
      data: transactions,
    }),
    processRefund: jest.fn(),
    createSettlementBatch: jest.fn(),
  };
}

describe("TransactionViewService", () => {
  it("returns transaction summaries for a merchant", async () => {
    const paymentService = createMockPaymentService([sampleTransaction]);
    const viewService = new TransactionViewService(paymentService);

    const result = await viewService.getMerchantTransactions("MER-001");
    expect(result.success).toBe(true);
    expect(result.data!.length).toBe(1);
    expect(result.data![0].transactionId).toBe("TXN-dash-001");
    expect(result.data![0].amount).toBe(99.99);
  });

  it("returns transaction detail", async () => {
    const paymentService = createMockPaymentService([sampleTransaction]);
    const viewService = new TransactionViewService(paymentService);

    const result = await viewService.getTransactionDetail("TXN-dash-001");
    expect(result.success).toBe(true);
    expect(result.data!.status).toBe("settled");
  });

  it("handles missing transactions", async () => {
    const paymentService = createMockPaymentService();
    (paymentService.getTransaction as jest.Mock).mockResolvedValue({
      success: false,
      error: "Not found",
    });

    const viewService = new TransactionViewService(paymentService);
    const result = await viewService.getTransactionDetail("TXN-missing");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Transaction not found");
  });

  it("transaction summaries use token IDs, not raw customer data", async () => {
    const paymentService = createMockPaymentService([sampleTransaction]);
    const viewService = new TransactionViewService(paymentService);

    const result = await viewService.getMerchantTransactions("MER-001");
    const summary = result.data![0];

    expect(summary.customerTokenId).toMatch(/^CTK-/);
    expect(Object.keys(summary)).not.toContain("paymentTokenId");
  });
});
