import { SettlementService } from "../src/settlement";
import { AuthorizationService } from "../src/authorization";
import { AuditTrail } from "../../compliance/src/audit-trail";

describe("SettlementService", () => {
  let settlementService: SettlementService;
  let authService: AuthorizationService;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    authService = new AuthorizationService(auditTrail);
    settlementService = new SettlementService(auditTrail, authService);
  });

  it("creates a settlement batch from captured transactions", async () => {
    const txn1 = await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-001",
      paymentTokenId: "PTK-001",
      amount: 100.0,
      currency: "USD",
      type: "credit_card",
    });
    await authService.updateTransactionStatus(
      txn1.data!.transactionId,
      "captured",
      "capturedAt",
    );

    const txn2 = await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-002",
      paymentTokenId: "PTK-002",
      amount: 200.0,
      currency: "USD",
      type: "credit_card",
    });
    await authService.updateTransactionStatus(
      txn2.data!.transactionId,
      "captured",
      "capturedAt",
    );

    const batchResult = await settlementService.createBatch("MER-001", [
      txn1.data!.transactionId,
      txn2.data!.transactionId,
    ]);

    expect(batchResult.success).toBe(true);
    expect(batchResult.data!.batchId).toMatch(/^BATCH-/);
    expect(batchResult.data!.totalAmount).toBe(300.0);
    expect(batchResult.data!.transactionIds.length).toBe(2);
  });

  it("rejects batch with uncaptured transactions", async () => {
    const txn = await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-001",
      paymentTokenId: "PTK-001",
      amount: 100.0,
      currency: "USD",
      type: "credit_card",
    });

    const batchResult = await settlementService.createBatch("MER-001", [
      txn.data!.transactionId,
    ]);

    expect(batchResult.success).toBe(false);
    expect(batchResult.error).toContain("must be captured");
  });

  it("processes a settlement batch", async () => {
    const txn = await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-001",
      paymentTokenId: "PTK-001",
      amount: 150.0,
      currency: "USD",
      type: "debit_card",
    });
    await authService.updateTransactionStatus(
      txn.data!.transactionId,
      "captured",
      "capturedAt",
    );

    const batchResult = await settlementService.createBatch("MER-001", [
      txn.data!.transactionId,
    ]);

    const processResult = await settlementService.processBatch(
      batchResult.data!.batchId,
    );

    expect(processResult.success).toBe(true);
    expect(processResult.data!.status).toBe("settled");
    expect(processResult.data!.settledAt).toBeDefined();

    const settledTxn = await authService.getTransaction(
      txn.data!.transactionId,
    );
    expect(settledTxn.data!.status).toBe("settled");
  });
});
