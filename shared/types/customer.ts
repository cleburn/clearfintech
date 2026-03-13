/**
 * Tokenized customer representation for cross-domain use.
 * Raw PII never crosses the customers domain boundary.
 * All fields are masked or tokenized before leaving the vault.
 */
export interface TokenizedCustomer {
  tokenId: string;
  maskedName: string;
  maskedEmail: string;
  maskedPhone: string;
  city: string;
  state: string;
  merchantTier: string;
  enrollmentDate: string;
}

/**
 * Tokenized payment method for cross-domain use.
 * Raw account/card numbers never leave the vault.
 */
export interface TokenizedPaymentMethod {
  paymentTokenId: string;
  customerTokenId: string;
  bankName: string;
  maskedAccountNumber: string;
  accountType: string;
}
