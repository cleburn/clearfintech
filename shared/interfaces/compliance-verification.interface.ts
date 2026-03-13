import { Result } from "../types/common";

/**
 * Cross-domain interface for compliance operations accessible to other domains.
 * SAR data, FinCEN content, and filing status NEVER cross this boundary.
 * Only verification results and risk assessments are exposed.
 */
export interface IComplianceVerification {
  verifyIdentity(
    request: IdentityVerificationRequest,
  ): Promise<Result<IdentityVerificationResult>>;

  assessRisk(
    merchantId: string,
  ): Promise<Result<RiskAssessmentResult>>;

  checkTransactionCompliance(
    request: TransactionComplianceRequest,
  ): Promise<Result<TransactionComplianceResult>>;
}

export interface IdentityVerificationRequest {
  applicationId: string;
  businessName: string;
  contactEmail: string;
  customerTokenId: string;
}

export interface IdentityVerificationResult {
  verified: boolean;
  verificationId: string;
  riskLevel: "low" | "medium" | "high";
  verifiedAt: string;
}

export interface RiskAssessmentResult {
  merchantId: string;
  riskLevel: "low" | "medium" | "high";
  assessedAt: string;
  factors: string[];
}

export interface TransactionComplianceRequest {
  transactionId: string;
  merchantId: string;
  amount: number;
  currency: string;
  type: string;
}

export interface TransactionComplianceResult {
  approved: boolean;
  transactionId: string;
  flags: string[];
  checkedAt: string;
}
