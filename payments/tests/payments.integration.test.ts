import { PaymentService } from "../src/payment-service";
import { AuditTrail } from "../../compliance/src/audit-trail";

describe("PaymentService integration", () => {
  let paymentService: PaymentService;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    paymentService = new PaymentService(auditTrail);
  });

  it("provisions a merchant account", async () => {
    const result = await paymentService.provisionMerchantAccount({
      applicationId: "APP-001",
      businessName: "Integration Test Shop",
      tier: "Standard",
    });

    expect(result.success).toBe(true);
    expect(result.data!.merchantId).toMatch(/^MER-/);
    expect(result.data!.status).toBe("active");
  });

  it("processes a full transaction lifecycle", async () => {
    const account = await paymentService.provisionMerchantAccount({
      applicationId: "APP-002",
      businessName: "Lifecycle Test Shop",
      tier: "Premium",
    });

    const txn = await paymentService.processTransaction({
      merchantId: account.data!.merchantId,
      customerTokenId: "CTK-INT-001",
      paymentTokenId: "PTK-INT-001",
      amount: 250.0,
      currency: "USD",
      type: "credit_card",
    });

    expect(txn.success).toBe(true);
    expect(txn.data!.status).toBe("authorized");

    const captured = await paymentService.captureTransaction(
      txn.data!.transactionId,
    );
    expect(captured.data!.status).toBe("captured");

    const settled = await paymentService.settleTransaction(
      txn.data!.transactionId,
    );
    expect(settled.data!.status).toBe("settled");
  });

  it("processes a refund", async () => {
    const account = await paymentService.provisionMerchantAccount({
      applicationId: "APP-003",
      businessName: "Refund Test Shop",
      tier: "Standard",
    });

    const txn = await paymentService.processTransaction({
      merchantId: account.data!.merchantId,
      customerTokenId: "CTK-INT-002",
      paymentTokenId: "PTK-INT-002",
      amount: 75.0,
      currency: "USD",
      type: "debit_card",
    });

    await paymentService.captureTransaction(txn.data!.transactionId);

    const refund = await paymentService.processRefund({
      transactionId: txn.data!.transactionId,
      merchantId: account.data!.merchantId,
      amount: 75.0,
      reason: "Customer request",
    });

    expect(refund.success).toBe(true);
    expect(refund.data!.status).toBe("processed");
  });

  it("produces complete audit trail for all operations", async () => {
    const account = await paymentService.provisionMerchantAccount({
      applicationId: "APP-004",
      businessName: "Audit Test Shop",
      tier: "Enterprise",
    });

    await paymentService.processTransaction({
      merchantId: account.data!.merchantId,
      customerTokenId: "CTK-INT-003",
      paymentTokenId: "PTK-INT-003",
      amount: 100.0,
      currency: "USD",
      type: "ach",
    });

    const entries = auditTrail.getAllEntries();
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries.every((e) => e.domain === "payments")).toBe(true);
  });
});
