import { Result } from "@shared/types/common";
import { TokenizedCustomer, TokenizedPaymentMethod } from "@shared/types/customer";
import {
  ICustomerVault,
  CreateCustomerRequest,
} from "@shared/interfaces/customer-vault.interface";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";
import { encrypt, decrypt } from "./encryption";
import {
  generateCustomerToken,
  generatePaymentToken,
  storeTokenMapping,
} from "./tokenizer";
import { maskName, maskEmail, maskPhone, maskAccountNumber } from "./masking";

interface EncryptedCustomerRecord {
  internalId: string;
  tokenId: string;
  encryptedData: string;
  merchantTier: string;
  enrollmentDate: string;
  merchantId: string;
  createdAt: string;
}

interface EncryptedPaymentMethod {
  paymentTokenId: string;
  customerTokenId: string;
  bankName: string;
  encryptedAccountNumber: string;
  encryptedRoutingNumber: string;
  accountType: string;
}

interface CustomerPII {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssn: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export class CustomerVault implements ICustomerVault {
  private customers: Map<string, EncryptedCustomerRecord> = new Map();
  private paymentMethods: Map<string, EncryptedPaymentMethod> = new Map();
  private auditLog: IAuditLog;

  constructor(auditLog: IAuditLog) {
    this.auditLog = auditLog;
  }

  async createCustomer(
    request: CreateCustomerRequest,
  ): Promise<Result<string>> {
    const internalId = `INT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const tokenId = generateCustomerToken();
    storeTokenMapping(tokenId, internalId);

    const pii: CustomerPII = {
      firstName: request.firstName,
      lastName: request.lastName,
      dateOfBirth: request.dateOfBirth,
      ssn: request.ssn,
      email: request.email,
      phone: request.phone,
      address: request.address,
      city: request.city,
      state: request.state,
      zip: request.zip,
    };

    const encryptedData = encrypt(JSON.stringify(pii));

    const record: EncryptedCustomerRecord = {
      internalId,
      tokenId,
      encryptedData,
      merchantTier: "Standard",
      enrollmentDate: new Date().toISOString(),
      merchantId: request.merchantId,
      createdAt: new Date().toISOString(),
    };

    this.customers.set(tokenId, record);

    const paymentTokenId = generatePaymentToken();
    const paymentMethod: EncryptedPaymentMethod = {
      paymentTokenId,
      customerTokenId: tokenId,
      bankName: request.bankName,
      encryptedAccountNumber: encrypt(request.accountNumber),
      encryptedRoutingNumber: encrypt(request.routingNumber),
      accountType: request.accountType,
    };
    this.paymentMethods.set(paymentTokenId, paymentMethod);

    await this.auditLog.log({
      actor: "customers-vault",
      action: "customer_created",
      domain: "customers",
      resourceType: "customer",
      resourceId: tokenId,
      details: "New customer record created with encrypted PII",
      outcome: "success",
    });

    return { success: true, data: tokenId };
  }

  async getCustomerByToken(
    tokenId: string,
  ): Promise<Result<TokenizedCustomer>> {
    const record = this.customers.get(tokenId);
    if (!record) {
      return { success: false, error: "Customer not found" };
    }

    const pii: CustomerPII = JSON.parse(decrypt(record.encryptedData));

    await this.auditLog.log({
      actor: "customers-vault",
      action: "customer_accessed",
      domain: "customers",
      resourceType: "customer",
      resourceId: tokenId,
      details: "Tokenized customer data accessed via vault interface",
      outcome: "success",
    });

    return {
      success: true,
      data: {
        tokenId: record.tokenId,
        maskedName: maskName(pii.firstName, pii.lastName),
        maskedEmail: maskEmail(pii.email),
        maskedPhone: maskPhone(pii.phone),
        city: pii.city,
        state: pii.state,
        merchantTier: record.merchantTier,
        enrollmentDate: record.enrollmentDate,
      },
    };
  }

  async getPaymentMethodByToken(
    paymentTokenId: string,
  ): Promise<Result<TokenizedPaymentMethod>> {
    const method = this.paymentMethods.get(paymentTokenId);
    if (!method) {
      return { success: false, error: "Payment method not found" };
    }

    const rawAccountNumber = decrypt(method.encryptedAccountNumber);

    await this.auditLog.log({
      actor: "customers-vault",
      action: "payment_method_accessed",
      domain: "customers",
      resourceType: "payment_method",
      resourceId: paymentTokenId,
      details: "Tokenized payment method accessed via vault interface",
      outcome: "success",
    });

    return {
      success: true,
      data: {
        paymentTokenId: method.paymentTokenId,
        customerTokenId: method.customerTokenId,
        bankName: method.bankName,
        maskedAccountNumber: maskAccountNumber(rawAccountNumber),
        accountType: method.accountType,
      },
    };
  }

  async searchCustomers(
    merchantId: string,
    query: string,
  ): Promise<Result<TokenizedCustomer[]>> {
    const results: TokenizedCustomer[] = [];
    const lowerQuery = query.toLowerCase();

    for (const record of this.customers.values()) {
      if (record.merchantId !== merchantId) continue;

      const pii: CustomerPII = JSON.parse(decrypt(record.encryptedData));
      const nameMatch =
        pii.firstName.toLowerCase().includes(lowerQuery) ||
        pii.lastName.toLowerCase().includes(lowerQuery);
      const cityMatch = pii.city.toLowerCase().includes(lowerQuery);

      if (nameMatch || cityMatch) {
        results.push({
          tokenId: record.tokenId,
          maskedName: maskName(pii.firstName, pii.lastName),
          maskedEmail: maskEmail(pii.email),
          maskedPhone: maskPhone(pii.phone),
          city: pii.city,
          state: pii.state,
          merchantTier: record.merchantTier,
          enrollmentDate: record.enrollmentDate,
        });
      }
    }

    await this.auditLog.log({
      actor: "customers-vault",
      action: "customer_search",
      domain: "customers",
      resourceType: "customer",
      resourceId: merchantId,
      details: `Search executed, ${results.length} results returned (masked)`,
      outcome: "success",
    });

    return { success: true, data: results };
  }

  async getCustomersByMerchant(
    merchantId: string,
  ): Promise<Result<TokenizedCustomer[]>> {
    const results: TokenizedCustomer[] = [];

    for (const record of this.customers.values()) {
      if (record.merchantId !== merchantId) continue;

      const pii: CustomerPII = JSON.parse(decrypt(record.encryptedData));
      results.push({
        tokenId: record.tokenId,
        maskedName: maskName(pii.firstName, pii.lastName),
        maskedEmail: maskEmail(pii.email),
        maskedPhone: maskPhone(pii.phone),
        city: pii.city,
        state: pii.state,
        merchantTier: record.merchantTier,
        enrollmentDate: record.enrollmentDate,
      });
    }

    await this.auditLog.log({
      actor: "customers-vault",
      action: "customers_listed",
      domain: "customers",
      resourceType: "customer",
      resourceId: merchantId,
      details: `Listed ${results.length} customers for merchant (masked)`,
      outcome: "success",
    });

    return { success: true, data: results };
  }
}
