import {
  canTransition,
  getNextStep,
  isTerminalStep,
  getStepIndex,
} from "../src/workflow";

describe("Onboarding Workflow", () => {
  describe("canTransition", () => {
    it("allows valid forward transitions", () => {
      expect(canTransition("application_submitted", "documents_collected")).toBe(
        true,
      );
      expect(canTransition("documents_collected", "identity_verified")).toBe(
        true,
      );
      expect(canTransition("identity_verified", "risk_assessed")).toBe(true);
      expect(canTransition("risk_assessed", "account_provisioned")).toBe(true);
      expect(canTransition("account_provisioned", "approved")).toBe(true);
    });

    it("rejects invalid transitions", () => {
      expect(canTransition("application_submitted", "approved")).toBe(false);
      expect(canTransition("approved", "application_submitted")).toBe(false);
      expect(canTransition("documents_collected", "account_provisioned")).toBe(
        false,
      );
    });

    it("rejects transitions from terminal state", () => {
      expect(canTransition("approved", "documents_collected")).toBe(false);
    });
  });

  describe("getNextStep", () => {
    it("returns the next step in the workflow", () => {
      expect(getNextStep("application_submitted")).toBe(
        "documents_collected",
      );
      expect(getNextStep("documents_collected")).toBe("identity_verified");
      expect(getNextStep("identity_verified")).toBe("risk_assessed");
    });

    it("returns null for terminal step", () => {
      expect(getNextStep("approved")).toBeNull();
    });
  });

  describe("isTerminalStep", () => {
    it("returns true for approved", () => {
      expect(isTerminalStep("approved")).toBe(true);
    });

    it("returns false for non-terminal steps", () => {
      expect(isTerminalStep("application_submitted")).toBe(false);
      expect(isTerminalStep("documents_collected")).toBe(false);
    });
  });

  describe("getStepIndex", () => {
    it("returns sequential indices", () => {
      expect(getStepIndex("application_submitted")).toBe(0);
      expect(getStepIndex("documents_collected")).toBe(1);
      expect(getStepIndex("identity_verified")).toBe(2);
      expect(getStepIndex("risk_assessed")).toBe(3);
      expect(getStepIndex("account_provisioned")).toBe(4);
      expect(getStepIndex("approved")).toBe(5);
    });
  });
});
