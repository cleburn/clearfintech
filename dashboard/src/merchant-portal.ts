import { Result } from "@shared/types/common";
import { TokenizedCustomer } from "@shared/types/customer";
import { ICustomerVault } from "@shared/interfaces/customer-vault.interface";

/**
 * Merchant portal service.
 * Only receives tokenized or masked data through shared interfaces.
 * No access to raw PII, raw financial data, or customer bank information.
 * No decryption or de-tokenization logic exists in this domain.
 */

export interface MerchantDashboardData {
  merchantId: string;
  customers: TokenizedCustomer[];
  totalCustomers: number;
}

export class MerchantPortalService {
  private customerVault: ICustomerVault;

  constructor(customerVault: ICustomerVault) {
    this.customerVault = customerVault;
  }

  async getDashboardData(
    merchantId: string,
  ): Promise<Result<MerchantDashboardData>> {
    const customersResult =
      await this.customerVault.getCustomersByMerchant(merchantId);

    if (!customersResult.success || !customersResult.data) {
      return { success: false, error: "Failed to retrieve customer data" };
    }

    return {
      success: true,
      data: {
        merchantId,
        customers: customersResult.data,
        totalCustomers: customersResult.data.length,
      },
    };
  }

  async searchCustomers(
    merchantId: string,
    query: string,
  ): Promise<Result<TokenizedCustomer[]>> {
    return this.customerVault.searchCustomers(merchantId, query);
  }
}
