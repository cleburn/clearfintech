import { OnboardingOrchestrator } from "../src/orchestrator";
import { AuditTrail } from "../../compliance/src/audit-trail";
import { AmlMonitor } from "../../compliance/src/aml-monitor";
import { ComplianceVerificationService } from "../../compliance/src/identity-verification";
import { PaymentService } from "../../payments/src/payment-service";

describe("Onboarding integration", () => {
  let orchestrator: OnboardingOrchestrator;
  let auditTrail: AuditTrail;
  let paymentService: PaymentService;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    const amlMonitor = new AmlMonitor(auditTrail);
    const complianceService = new ComplianceVerificationService(
      auditTrail,
      amlMonitor,
    );
    paymentService = new PaymentService(auditTrail);
    orchestrator = new OnboardingOrchestrator(
      auditTrail,
      complianceService,
      paymentService,
    );
  });

  it("onboarded merchant can process transactions", async () => {
    const submitResult = await orchestrator.submitApplication({
      businessName: "E2E Test Shop",
      businessType: "retail",
      contactEmail: "e2e@shop.com",
      contactPhone: "(555) 444-3333",
      tier: "Standard",
    });

    const processResult = await orchestrator.processApplication(
      submitResult.data!.applicationId,
      "CTK-e2e-001",
    );

    const merchantId = processResult.data!.merchantId;

    const txn = await paymentService.processTransaction({
      merchantId,
      customerTokenId: "CTK-e2e-002",
      paymentTokenId: "PTK-e2e-001",
      amount: 49.99,
      currency: "USD",
      type: "credit_card",
    });

    expect(txn.success).toBe(true);
    expect(txn.data!.merchantId).toBe(merchantId);
  });

  it("produces audit trail spanning onboarding, compliance, and payments", async () => {
    const submitResult = await orchestrator.submitApplication({
      businessName: "Audit Trail Shop",
      businessType: "restaurant",
      contactEmail: "audit@shop.com",
      contactPhone: "(555) 222-1111",
      tier: "Premium",
    });

    await orchestrator.processApplication(
      submitResult.data!.applicationId,
      "CTK-audit-001",
    );

    const allEntries = auditTrail.getAllEntries();
    expect(allEntries.length).toBeGreaterThanOrEqual(5);

    const domains = new Set(allEntries.map((e) => e.domain));
    expect(domains.has("onboarding")).toBe(true);
    expect(domains.has("compliance")).toBe(true);
    expect(domains.has("payments")).toBe(true);
  });
});
