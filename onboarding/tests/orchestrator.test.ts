import { OnboardingOrchestrator } from "../src/orchestrator";
import { AuditTrail } from "../../compliance/src/audit-trail";
import { AmlMonitor } from "../../compliance/src/aml-monitor";
import { ComplianceVerificationService } from "../../compliance/src/identity-verification";
import { PaymentService } from "../../payments/src/payment-service";

describe("OnboardingOrchestrator", () => {
  let orchestrator: OnboardingOrchestrator;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    const amlMonitor = new AmlMonitor(auditTrail);
    const complianceService = new ComplianceVerificationService(
      auditTrail,
      amlMonitor,
    );
    const paymentService = new PaymentService(auditTrail);
    orchestrator = new OnboardingOrchestrator(
      auditTrail,
      complianceService,
      paymentService,
    );
  });

  it("submits a new application", async () => {
    const result = await orchestrator.submitApplication({
      businessName: "Orchestrator Test Shop",
      businessType: "retail",
      contactEmail: "orch@shop.com",
      contactPhone: "(555) 888-9999",
      tier: "Standard",
    });

    expect(result.success).toBe(true);
    expect(result.data!.applicationId).toMatch(/^APP-/);
    expect(result.data!.status).toBe("pending");
  });

  it("processes a full onboarding flow", async () => {
    const submitResult = await orchestrator.submitApplication({
      businessName: "Full Flow Shop",
      businessType: "ecommerce",
      contactEmail: "flow@shop.com",
      contactPhone: "(555) 777-6666",
      tier: "Premium",
    });

    const appId = submitResult.data!.applicationId;

    const processResult = await orchestrator.processApplication(
      appId,
      "CTK-orch-001",
    );

    expect(processResult.success).toBe(true);
    expect(processResult.data!.merchantId).toMatch(/^MER-/);
    expect(processResult.data!.status).toBe("active");
    expect(processResult.data!.tier).toBe("Premium");
  });

  it("retrieves application after processing", async () => {
    const submitResult = await orchestrator.submitApplication({
      businessName: "Retrieve Test Shop",
      businessType: "services",
      contactEmail: "retrieve@shop.com",
      contactPhone: "(555) 555-5555",
      tier: "Enterprise",
    });

    const appId = submitResult.data!.applicationId;
    await orchestrator.processApplication(appId, "CTK-orch-002");

    const getResult = await orchestrator.getApplication(appId);
    expect(getResult.success).toBe(true);
    expect(getResult.data!.status).toBe("approved");
    expect(getResult.data!.currentStep).toBe("approved");
  });

  it("returns error for non-existent application", async () => {
    const result = await orchestrator.processApplication(
      "APP-nonexistent",
      "CTK-orch-003",
    );
    expect(result.success).toBe(false);
  });
});
