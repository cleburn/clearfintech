import { CustomerVault } from "../src/vault";
import { AuditTrail } from "../../compliance/src/audit-trail";
import { CreateCustomerRequest } from "@shared/interfaces/customer-vault.interface";

const TEST_KEY = "b".repeat(64);

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

function createRequest(index: number): CreateCustomerRequest {
  return {
    merchantId: "MER-integration-001",
    firstName: `Customer${index}`,
    lastName: `Last${index}`,
    email: `customer${index}@test.com`,
    phone: `(555) 000-${String(index).padStart(4, "0")}`,
    address: `${index} Test Street`,
    city: "Austin",
    state: "TX",
    zip: "78701",
    dateOfBirth: "01/01/1990",
    ssn: `000-00-${String(index).padStart(4, "0")}`,
    bankName: "Test Bank",
    routingNumber: "000000001",
    accountNumber: `ACC${String(index).padStart(8, "0")}`,
    accountType: "Checking",
  };
}

describe("CustomerVault integration", () => {
  let vault: CustomerVault;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    vault = new CustomerVault(auditTrail);
  });

  it("handles multiple customer creation and retrieval", async () => {
    const tokenIds: string[] = [];

    for (let i = 1; i <= 5; i++) {
      const result = await vault.createCustomer(createRequest(i));
      expect(result.success).toBe(true);
      tokenIds.push(result.data!);
    }

    expect(tokenIds.length).toBe(5);
    expect(new Set(tokenIds).size).toBe(5);

    for (const tokenId of tokenIds) {
      const getResult = await vault.getCustomerByToken(tokenId);
      expect(getResult.success).toBe(true);
      expect(getResult.data!.city).toBe("Austin");
      expect(getResult.data!.state).toBe("TX");
    }
  });

  it("isolates customers by merchant", async () => {
    await vault.createCustomer(createRequest(1));
    await vault.createCustomer({
      ...createRequest(2),
      merchantId: "MER-integration-002",
    });

    const merchant1 = await vault.getCustomersByMerchant("MER-integration-001");
    const merchant2 = await vault.getCustomersByMerchant("MER-integration-002");

    expect(merchant1.data!.length).toBe(1);
    expect(merchant2.data!.length).toBe(1);
  });

  it("produces complete audit trail for all operations", async () => {
    const createResult = await vault.createCustomer(createRequest(1));
    await vault.getCustomerByToken(createResult.data!);
    await vault.getCustomersByMerchant("MER-integration-001");
    await vault.searchCustomers("MER-integration-001", "Customer");

    const entries = auditTrail.getAllEntries();
    expect(entries.length).toBe(4);

    const actions = entries.map((e) => e.action);
    expect(actions).toContain("customer_created");
    expect(actions).toContain("customer_accessed");
    expect(actions).toContain("customers_listed");
    expect(actions).toContain("customer_search");
  });
});
