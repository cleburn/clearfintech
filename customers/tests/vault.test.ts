import { CustomerVault } from "../src/vault";
import { AuditTrail } from "../../compliance/src/audit-trail";
import { CreateCustomerRequest } from "@shared/interfaces/customer-vault.interface";

const TEST_KEY = "a".repeat(64);

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

function createTestRequest(overrides?: Partial<CreateCustomerRequest>): CreateCustomerRequest {
  return {
    merchantId: "MER-test-001",
    firstName: "Robert",
    lastName: "Mitchell",
    email: "robert.mitchell95@yahoo.com",
    phone: "(207) 977-3615",
    address: "4606 Birch Way Apt 755",
    city: "San Antonio",
    state: "TX",
    zip: "78244",
    dateOfBirth: "10/11/1966",
    ssn: "559-76-4558",
    bankName: "Discover Bank",
    routingNumber: "031100649",
    accountNumber: "00133890838",
    accountType: "Checking",
    ...overrides,
  };
}

describe("CustomerVault", () => {
  let vault: CustomerVault;
  let auditTrail: AuditTrail;

  beforeEach(() => {
    auditTrail = new AuditTrail();
    vault = new CustomerVault(auditTrail);
  });

  it("creates a customer and returns a token ID", async () => {
    const result = await vault.createCustomer(createTestRequest());
    expect(result.success).toBe(true);
    expect(result.data).toMatch(/^CTK-/);
  });

  it("retrieves a customer with masked data only", async () => {
    const createResult = await vault.createCustomer(createTestRequest());
    const tokenId = createResult.data!;

    const getResult = await vault.getCustomerByToken(tokenId);
    expect(getResult.success).toBe(true);
    expect(getResult.data).toBeDefined();

    const customer = getResult.data!;
    expect(customer.tokenId).toBe(tokenId);
    expect(customer.maskedName).toBe("R***** M*******");
    expect(customer.maskedEmail).toBe("ro***************@yahoo.com");
    expect(customer.city).toBe("San Antonio");
    expect(customer.state).toBe("TX");

    expect(customer.maskedName).not.toContain("Robert");
    expect(customer.maskedEmail).not.toContain("mitchell95");
  });

  it("returns error for non-existent token", async () => {
    const result = await vault.getCustomerByToken("CTK-nonexistent");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Customer not found");
  });

  it("retrieves tokenized payment method", async () => {
    await vault.createCustomer(createTestRequest());

    const customers = await vault.getCustomersByMerchant("MER-test-001");
    expect(customers.success).toBe(true);
    expect(customers.data!.length).toBe(1);
  });

  it("searches customers by name (returns masked results)", async () => {
    await vault.createCustomer(createTestRequest());
    await vault.createCustomer(
      createTestRequest({
        firstName: "Kimberly",
        lastName: "Martinez",
        email: "kim@example.com",
      }),
    );

    const results = await vault.searchCustomers("MER-test-001", "Robert");
    expect(results.success).toBe(true);
    expect(results.data!.length).toBe(1);
    expect(results.data![0].maskedName).toBe("R***** M*******");
  });

  it("creates audit trail entries for all operations", async () => {
    const createResult = await vault.createCustomer(createTestRequest());
    const tokenId = createResult.data!;
    await vault.getCustomerByToken(tokenId);
    await vault.getCustomersByMerchant("MER-test-001");

    const entries = auditTrail.getAllEntries();
    expect(entries.length).toBeGreaterThanOrEqual(3);
    expect(entries.every((e) => e.domain === "customers")).toBe(true);
  });

  it("never exposes raw PII in tokenized customer objects", async () => {
    const createResult = await vault.createCustomer(createTestRequest());
    const tokenId = createResult.data!;
    const getResult = await vault.getCustomerByToken(tokenId);
    const customer = getResult.data!;

    const serialized = JSON.stringify(customer);
    expect(serialized).not.toContain("559-76-4558");
    expect(serialized).not.toContain("031100649");
    expect(serialized).not.toContain("00133890838");
    expect(serialized).not.toContain("10/11/1966");
    expect(serialized).not.toContain("4606 Birch Way");
    expect(serialized).not.toContain("robert.mitchell95@yahoo.com");
  });
});
