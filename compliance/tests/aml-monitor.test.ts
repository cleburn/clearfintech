import { AmlMonitor } from "../src/aml-monitor";
import { AuditTrail } from "../src/audit-trail";

describe("AmlMonitor", () => {
  let monitor: AmlMonitor;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    monitor = new AmlMonitor(auditTrail);
  });

  it("does not flag transactions below single threshold", async () => {
    const result = await monitor.checkTransaction("MER-001", "TXN-001", 5000);
    expect(result.flagged).toBe(false);
    expect(result.alertCount).toBe(0);
  });

  it("flags transactions at or above single threshold ($10,000)", async () => {
    const result = await monitor.checkTransaction(
      "MER-001",
      "TXN-001",
      10_000,
    );
    expect(result.flagged).toBe(true);
    expect(result.alertCount).toBeGreaterThanOrEqual(1);
  });

  it("flags cumulative daily transactions exceeding $25,000", async () => {
    await monitor.checkTransaction("MER-001", "TXN-001", 9000);
    await monitor.checkTransaction("MER-001", "TXN-002", 9000);
    const result = await monitor.checkTransaction("MER-001", "TXN-003", 8000);

    expect(result.flagged).toBe(true);
    expect(monitor.getAlertCount()).toBeGreaterThanOrEqual(1);
  });

  it("tracks alerts separately per merchant", async () => {
    await monitor.checkTransaction("MER-001", "TXN-001", 5000);
    await monitor.checkTransaction("MER-002", "TXN-002", 5000);

    expect(monitor.getAlertCount()).toBe(0);
  });

  it("creates audit entries for every screening", async () => {
    await monitor.checkTransaction("MER-001", "TXN-001", 500);
    await monitor.checkTransaction("MER-001", "TXN-002", 15000);

    const entries = auditTrail.getAllEntries();
    expect(entries.length).toBe(2);
    expect(entries.every((e) => e.action === "transaction_screened")).toBe(true);
  });

  it("clears daily accumulators", () => {
    monitor.clearDailyAccumulators();
    expect(monitor.getAlertCount()).toBe(0);
  });
});
