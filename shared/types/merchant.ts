export type MerchantTier = "Standard" | "Premium" | "Enterprise";

export type MerchantStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "active"
  | "suspended"
  | "terminated";

export type OnboardingStep =
  | "application_submitted"
  | "documents_collected"
  | "identity_verified"
  | "risk_assessed"
  | "account_provisioned"
  | "approved";

export interface MerchantApplication {
  applicationId: string;
  businessName: string;
  businessType: string;
  contactEmail: string;
  contactPhone: string;
  tier: MerchantTier;
  status: MerchantStatus;
  currentStep: OnboardingStep;
  submittedAt: string;
  updatedAt: string;
}

export interface MerchantAccount {
  merchantId: string;
  applicationId: string;
  businessName: string;
  tier: MerchantTier;
  status: MerchantStatus;
  createdAt: string;
  updatedAt: string;
}
