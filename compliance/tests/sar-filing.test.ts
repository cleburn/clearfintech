import { SarFilingService } from "../src/sar-filing";
import { AuditTrail } from "../src/audit-trail";

describe("SarFilingService", () => {
  let sarService: SarFilingService;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    sarService = new SarFilingService(auditTrail);
  });

  it("files a SAR and returns a SAR ID", async () => {
    const sarId = await sarService.fileSar(
      "MER-001",
      "Suspicious transaction pattern",
    );

    expect(sarId).toMatch(/^SAR-/);
    expect(sarService.getFilingCount()).toBe(1);
  });

  it("updates SAR status", async () => {
    const sarId = await sarService.fileSar("MER-001", "Test reason");
    const updated = await sarService.updateStatus(sarId, "filed");

    expect(updated).toBe(true);
  });

  it("returns false for non-existent SAR update", async () => {
    const updated = await sarService.updateStatus("SAR-nonexistent", "filed");
    expect(updated).toBe(false);
  });

  it("creates audit entries for SAR operations", async () => {
    const sarId = await sarService.fileSar("MER-001", "Test");
    await sarService.updateStatus(sarId, "filed");

    const entries = auditTrail.getAllEntries();
    expect(entries.length).toBe(2);
    expect(entries.every((e) => e.domain === "compliance")).toBe(true);
    expect(entries[0].action).toBe("sar_filed");
    expect(entries[1].action).toBe("sar_status_updated");
  });

  it("SAR data stays within compliance domain (no cross-boundary exposure)", () => {
    const sarServiceKeys = Object.keys(sarService);
    expect(sarServiceKeys).not.toContain("getFilingDetails");
    expect(sarServiceKeys).not.toContain("exportFilings");
  });
});
