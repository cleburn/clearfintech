import { MerchantPortalService } from "../src/merchant-portal";
import { ICustomerVault } from "@shared/interfaces/customer-vault.interface";
import { TokenizedCustomer } from "@shared/types/customer";

function createMockVault(
  customers: TokenizedCustomer[] = [],
): ICustomerVault {
  return {
    getCustomerByToken: jest.fn().mockResolvedValue({
      success: true,
      data: customers[0],
    }),
    getPaymentMethodByToken: jest.fn().mockResolvedValue({
      success: true,
      data: null,
    }),
    searchCustomers: jest.fn().mockResolvedValue({
      success: true,
      data: customers,
    }),
    createCustomer: jest.fn().mockResolvedValue({
      success: true,
      data: "CTK-mock-001",
    }),
    getCustomersByMerchant: jest.fn().mockResolvedValue({
      success: true,
      data: customers,
    }),
  };
}

const sampleCustomer: TokenizedCustomer = {
  tokenId: "CTK-dash-001",
  maskedName: "R***** M*******",
  maskedEmail: "ro***@example.com",
  maskedPhone: "******3615",
  city: "San Antonio",
  state: "TX",
  merchantTier: "Standard",
  enrollmentDate: "2024-12-15T00:00:00.000Z",
};

describe("MerchantPortalService", () => {
  it("returns dashboard data with tokenized customers", async () => {
    const vault = createMockVault([sampleCustomer]);
    const portal = new MerchantPortalService(vault);

    const result = await portal.getDashboardData("MER-001");
    expect(result.success).toBe(true);
    expect(result.data!.totalCustomers).toBe(1);
    expect(result.data!.customers[0].maskedName).toBe("R***** M*******");
  });

  it("never receives raw PII from vault", async () => {
    const vault = createMockVault([sampleCustomer]);
    const portal = new MerchantPortalService(vault);

    const result = await portal.getDashboardData("MER-001");
    const serialized = JSON.stringify(result.data);

    expect(serialized).not.toContain("Robert");
    expect(serialized).not.toContain("Mitchell");
    expect(serialized).not.toContain("559-76");
    expect(serialized).toContain("R*****");
  });

  it("searches customers through vault interface", async () => {
    const vault = createMockVault([sampleCustomer]);
    const portal = new MerchantPortalService(vault);

    const result = await portal.searchCustomers("MER-001", "test");
    expect(result.success).toBe(true);
    expect(vault.searchCustomers).toHaveBeenCalledWith("MER-001", "test");
  });

  it("handles vault errors gracefully", async () => {
    const vault = createMockVault();
    (vault.getCustomersByMerchant as jest.Mock).mockResolvedValue({
      success: false,
      error: "Vault unavailable",
    });

    const portal = new MerchantPortalService(vault);
    const result = await portal.getDashboardData("MER-001");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to retrieve customer data");
  });
});
