import { OnboardingStep } from "@shared/types/merchant";

/**
 * Onboarding workflow state machine.
 * Defines valid state transitions for merchant onboarding.
 * State transitions are deterministic and auditable.
 */

const VALID_TRANSITIONS: Record<OnboardingStep, OnboardingStep[]> = {
  application_submitted: ["documents_collected"],
  documents_collected: ["identity_verified"],
  identity_verified: ["risk_assessed"],
  risk_assessed: ["account_provisioned"],
  account_provisioned: ["approved"],
  approved: [],
};

const STEP_ORDER: OnboardingStep[] = [
  "application_submitted",
  "documents_collected",
  "identity_verified",
  "risk_assessed",
  "account_provisioned",
  "approved",
];

export function canTransition(
  currentStep: OnboardingStep,
  nextStep: OnboardingStep,
): boolean {
  const validNext = VALID_TRANSITIONS[currentStep];
  return validNext.includes(nextStep);
}

export function getNextStep(
  currentStep: OnboardingStep,
): OnboardingStep | null {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return null;
  }
  return STEP_ORDER[currentIndex + 1];
}

export function isTerminalStep(step: OnboardingStep): boolean {
  return step === "approved";
}

export function getStepIndex(step: OnboardingStep): number {
  return STEP_ORDER.indexOf(step);
}
