import { AuditTrail } from "../src/audit-trail";
import { AmlMonitor } from "../src/aml-monitor";
import { ComplianceVerificationService } from "../src/identity-verification";
import { SarFilingService } from "../src/sar-filing";

describe("Compliance domain integration", () => {
  let auditTrail: AuditTrail;
  let amlMonitor: AmlMonitor;
  let verificationService: ComplianceVerificationService;
  let sarService: SarFilingService;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    amlMonitor = new AmlMonitor(auditTrail);
    verificationService = new ComplianceVerificationService(
      auditTrail,
      amlMonitor,
    );
    sarService = new SarFilingService(auditTrail);
  });

  it("full compliance workflow: verify, screen, file SAR when flagged", async () => {
    const verifyResult = await verificationService.verifyIdentity({
      applicationId: "APP-INT-001",
      businessName: "Integration Test Corp",
      contactEmail: "test@corp.com",
      customerTokenId: "CTK-INT-001",
    });
    expect(verifyResult.success).toBe(true);

    const complianceResult =
      await verificationService.checkTransactionCompliance({
        transactionId: "TXN-INT-001",
        merchantId: "MER-INT-001",
        amount: 15000,
        currency: "USD",
        type: "ach",
      });
    expect(complianceResult.data!.approved).toBe(false);

    const sarId = await sarService.fileSar(
      "MER-INT-001",
      "AML threshold exceeded in compliance check",
    );
    expect(sarId).toMatch(/^SAR-/);

    await sarService.updateStatus(sarId, "filed");

    const allEntries = auditTrail.getAllEntries();
    expect(allEntries.length).toBeGreaterThanOrEqual(5);
    expect(allEntries.every((e) => e.domain === "compliance")).toBe(true);
  });

  it("all audit entries are produced within compliance domain", async () => {
    await verificationService.assessRisk("MER-INT-002");
    await amlMonitor.checkTransaction("MER-INT-002", "TXN-INT-002", 500);

    const entries = auditTrail.getAllEntries();
    for (const entry of entries) {
      expect(entry.domain).toBe("compliance");
    }
  });
});
