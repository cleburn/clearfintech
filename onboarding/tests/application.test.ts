import { ApplicationService } from "../src/application";
import { AuditTrail } from "../../compliance/src/audit-trail";

describe("ApplicationService", () => {
  let appService: ApplicationService;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    appService = new ApplicationService(auditTrail);
  });

  it("creates a merchant application", async () => {
    const result = await appService.createApplication({
      businessName: "Test Shop",
      businessType: "retail",
      contactEmail: "test@shop.com",
      contactPhone: "(555) 123-4567",
      tier: "Standard",
    });

    expect(result.success).toBe(true);
    expect(result.data!.applicationId).toMatch(/^APP-/);
    expect(result.data!.status).toBe("pending");
    expect(result.data!.currentStep).toBe("application_submitted");
  });

  it("advances through workflow steps", async () => {
    const createResult = await appService.createApplication({
      businessName: "Step Test Shop",
      businessType: "ecommerce",
      contactEmail: "step@shop.com",
      contactPhone: "(555) 000-0000",
      tier: "Premium",
    });

    const appId = createResult.data!.applicationId;

    const step1 = await appService.advanceStep(appId, "documents_collected");
    expect(step1.data!.currentStep).toBe("documents_collected");
    expect(step1.data!.status).toBe("under_review");

    const step2 = await appService.advanceStep(appId, "identity_verified");
    expect(step2.data!.currentStep).toBe("identity_verified");
  });

  it("rejects invalid step transitions", async () => {
    const createResult = await appService.createApplication({
      businessName: "Invalid Step Shop",
      businessType: "services",
      contactEmail: "invalid@shop.com",
      contactPhone: "(555) 111-2222",
      tier: "Standard",
    });

    const result = await appService.advanceStep(
      createResult.data!.applicationId,
      "approved",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot transition");
  });

  it("creates audit entries for all operations", async () => {
    const createResult = await appService.createApplication({
      businessName: "Audit Shop",
      businessType: "retail",
      contactEmail: "audit@shop.com",
      contactPhone: "(555) 333-4444",
      tier: "Standard",
    });

    await appService.advanceStep(
      createResult.data!.applicationId,
      "documents_collected",
    );

    const entries = auditTrail.getAllEntries();
    expect(entries.length).toBe(2);
    expect(entries.every((e) => e.domain === "onboarding")).toBe(true);
  });
});
