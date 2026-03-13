import { AuthorizationService } from "../src/authorization";
import { AuditTrail } from "../../compliance/src/audit-trail";

describe("AuthorizationService", () => {
  let authService: AuthorizationService;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    authService = new AuthorizationService(auditTrail);
  });

  it("authorizes a transaction", async () => {
    const result = await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-001",
      paymentTokenId: "PTK-001",
      amount: 99.99,
      currency: "USD",
      type: "credit_card",
    });

    expect(result.success).toBe(true);
    expect(result.data!.transactionId).toMatch(/^TXN-/);
    expect(result.data!.status).toBe("authorized");
    expect(result.data!.amount).toBe(99.99);
  });

  it("retrieves a transaction by ID", async () => {
    const createResult = await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-001",
      paymentTokenId: "PTK-001",
      amount: 50.0,
      currency: "USD",
      type: "debit_card",
    });

    const txnId = createResult.data!.transactionId;
    const getResult = await authService.getTransaction(txnId);

    expect(getResult.success).toBe(true);
    expect(getResult.data!.transactionId).toBe(txnId);
  });

  it("returns error for non-existent transaction", async () => {
    const result = await authService.getTransaction("TXN-nonexistent");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Transaction not found");
  });

  it("retrieves transactions by merchant", async () => {
    await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-001",
      paymentTokenId: "PTK-001",
      amount: 10.0,
      currency: "USD",
      type: "credit_card",
    });

    await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-002",
      paymentTokenId: "PTK-002",
      amount: 20.0,
      currency: "USD",
      type: "ach",
    });

    const result = await authService.getTransactionsByMerchant("MER-001");
    expect(result.data!.length).toBe(2);
  });

  it("updates transaction status", async () => {
    const createResult = await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-001",
      paymentTokenId: "PTK-001",
      amount: 100.0,
      currency: "USD",
      type: "credit_card",
    });

    const txnId = createResult.data!.transactionId;
    const captureResult = await authService.updateTransactionStatus(
      txnId,
      "captured",
      "capturedAt",
    );

    expect(captureResult.success).toBe(true);
    expect(captureResult.data!.status).toBe("captured");
    expect(captureResult.data!.capturedAt).toBeDefined();
  });

  it("creates audit entries for all operations", async () => {
    const createResult = await authService.authorize({
      merchantId: "MER-001",
      customerTokenId: "CTK-001",
      paymentTokenId: "PTK-001",
      amount: 100.0,
      currency: "USD",
      type: "credit_card",
    });

    await authService.updateTransactionStatus(
      createResult.data!.transactionId,
      "captured",
      "capturedAt",
    );

    const entries = auditTrail.getAllEntries();
    expect(entries.length).toBe(2);
    expect(entries.every((e) => e.domain === "payments")).toBe(true);
  });
});
