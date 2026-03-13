import { AuditTrail } from "../src/audit-trail";

describe("AuditTrail", () => {
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
  });

  it("logs an audit entry and returns it", async () => {
    const result = await auditTrail.log({
      actor: "test-actor",
      action: "test_action",
      domain: "compliance",
      resourceType: "test",
      resourceId: "TEST-001",
      details: "Test audit entry",
      outcome: "success",
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.id).toBeDefined();
    expect(result.data!.timestamp).toBeDefined();
    expect(result.data!.actor).toBe("test-actor");
    expect(result.data!.action).toBe("test_action");
  });

  it("entries are immutable after creation", async () => {
    const result = await auditTrail.log({
      actor: "test",
      action: "create",
      domain: "compliance",
      resourceType: "test",
      resourceId: "TEST-001",
      details: "Immutability test",
      outcome: "success",
    });

    const entry = result.data!;
    expect(() => {
      (entry as unknown as Record<string, unknown>).action = "modified";
    }).toThrow();
  });

  it("retrieves entries by resource", async () => {
    await auditTrail.log({
      actor: "actor1",
      action: "action1",
      domain: "payments",
      resourceType: "transaction",
      resourceId: "TXN-001",
      details: "Detail 1",
      outcome: "success",
    });

    await auditTrail.log({
      actor: "actor2",
      action: "action2",
      domain: "payments",
      resourceType: "transaction",
      resourceId: "TXN-001",
      details: "Detail 2",
      outcome: "success",
    });

    await auditTrail.log({
      actor: "actor3",
      action: "action3",
      domain: "payments",
      resourceType: "transaction",
      resourceId: "TXN-002",
      details: "Different resource",
      outcome: "success",
    });

    const result = await auditTrail.getEntriesByResource(
      "transaction",
      "TXN-001",
    );
    expect(result.data!.length).toBe(2);
  });

  it("retrieves entries by actor", async () => {
    await auditTrail.log({
      actor: "specific-actor",
      action: "action1",
      domain: "payments",
      resourceType: "test",
      resourceId: "T-001",
      details: "Test",
      outcome: "success",
    });

    const result = await auditTrail.getEntriesByActor("specific-actor");
    expect(result.data!.length).toBe(1);
  });

  it("retrieves entries by domain", async () => {
    await auditTrail.log({
      actor: "actor",
      action: "action1",
      domain: "compliance",
      resourceType: "test",
      resourceId: "T-001",
      details: "Compliance entry",
      outcome: "success",
    });

    await auditTrail.log({
      actor: "actor",
      action: "action2",
      domain: "payments",
      resourceType: "test",
      resourceId: "T-002",
      details: "Payments entry",
      outcome: "success",
    });

    const complianceEntries =
      await auditTrail.getEntriesByDomain("compliance");
    expect(complianceEntries.data!.length).toBe(1);
    expect(complianceEntries.data![0].domain).toBe("compliance");
  });

  it("tracks entry count", async () => {
    expect(auditTrail.getEntryCount()).toBe(0);

    await auditTrail.log({
      actor: "a",
      action: "a",
      domain: "d",
      resourceType: "r",
      resourceId: "1",
      details: "d",
      outcome: "success",
    });

    expect(auditTrail.getEntryCount()).toBe(1);
  });
});
