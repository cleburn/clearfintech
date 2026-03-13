export const MERCHANT_TIERS = ["Standard", "Premium", "Enterprise"] as const;

export const SENSITIVITY_TIERS = {
  RESTRICTED: "restricted",
  HIGH: "high",
  STANDARD: "standard",
} as const;

export const AML_THRESHOLDS = {
  SINGLE_TRANSACTION: 10_000,
  CUMULATIVE_DAILY: 25_000,
} as const;

export const TOKEN_PREFIX = {
  CUSTOMER: "CTK",
  PAYMENT: "PTK",
} as const;

export const MASK_CHAR = "*";
export const MASK_VISIBLE_CHARS = 4;

export const DOMAINS = [
  "gateway",
  "onboarding",
  "payments",
  "compliance",
  "customers",
  "dashboard",
] as const;
