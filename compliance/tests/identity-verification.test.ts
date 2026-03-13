import { ComplianceVerificationService } from "../src/identity-verification";
import { AuditTrail } from "../src/audit-trail";
import { AmlMonitor } from "../src/aml-monitor";

describe("ComplianceVerificationService", () => {
  let service: ComplianceVerificationService;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    const amlMonitor = new AmlMonitor(auditTrail);
    service = new ComplianceVerificationService(auditTrail, amlMonitor);
  });

  describe("verifyIdentity", () => {
    it("verifies identity and returns verification result", async () => {
      const result = await service.verifyIdentity({
        applicationId: "APP-001",
        businessName: "Test Business",
        contactEmail: "test@business.com",
        customerTokenId: "CTK-001",
      });

      expect(result.success).toBe(true);
      expect(result.data!.verified).toBe(true);
      expect(result.data!.verificationId).toBeDefined();
      expect(result.data!.riskLevel).toBeDefined();
      expect(result.data!.verifiedAt).toBeDefined();
    });

    it("creates audit trail entry for verification", async () => {
      await service.verifyIdentity({
        applicationId: "APP-001",
        businessName: "Test Business",
        contactEmail: "test@business.com",
        customerTokenId: "CTK-001",
      });

      const entries = auditTrail.getAllEntries();
      expect(entries.length).toBeGreaterThanOrEqual(1);
      expect(entries.some((e) => e.action === "identity_verified")).toBe(true);
    });
  });

  describe("assessRisk", () => {
    it("returns risk assessment result", async () => {
      const result = await service.assessRisk("MER-001");

      expect(result.success).toBe(true);
      expect(result.data!.merchantId).toBe("MER-001");
      expect(result.data!.riskLevel).toBeDefined();
      expect(result.data!.factors.length).toBeGreaterThan(0);
    });
  });

  describe("checkTransactionCompliance", () => {
    it("approves compliant transactions", async () => {
      const result = await service.checkTransactionCompliance({
        transactionId: "TXN-001",
        merchantId: "MER-001",
        amount: 500,
        currency: "USD",
        type: "credit_card",
      });

      expect(result.success).toBe(true);
      expect(result.data!.approved).toBe(true);
      expect(result.data!.flags.length).toBe(0);
    });

    it("flags transactions exceeding AML threshold", async () => {
      const result = await service.checkTransactionCompliance({
        transactionId: "TXN-002",
        merchantId: "MER-001",
        amount: 15000,
        currency: "USD",
        type: "ach",
      });

      expect(result.success).toBe(true);
      expect(result.data!.approved).toBe(false);
      expect(result.data!.flags).toContain("aml_threshold_exceeded");
    });
  });
});
