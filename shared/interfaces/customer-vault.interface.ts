import { Result } from "../types/common";
import { TokenizedCustomer, TokenizedPaymentMethod } from "../types/customer";

/**
 * Cross-domain interface to the customer PII vault.
 * All data returned through this interface is tokenized or masked.
 * Raw PII never crosses this boundary.
 */
export interface ICustomerVault {
  getCustomerByToken(tokenId: string): Promise<Result<TokenizedCustomer>>;

  getPaymentMethodByToken(
    paymentTokenId: string,
  ): Promise<Result<TokenizedPaymentMethod>>;

  searchCustomers(
    merchantId: string,
    query: string,
  ): Promise<Result<TokenizedCustomer[]>>;

  createCustomer(request: CreateCustomerRequest): Promise<Result<string>>;

  getCustomersByMerchant(
    merchantId: string,
  ): Promise<Result<TokenizedCustomer[]>>;
}

export interface CreateCustomerRequest {
  merchantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dateOfBirth: string;
  ssn: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
}
