import { v4 as uuidv4 } from "uuid";
import { Result } from "@shared/types/common";
import {
  MerchantApplication,
  MerchantTier,
  OnboardingStep,
} from "@shared/types/merchant";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";
import { canTransition } from "./workflow";

export interface CreateApplicationRequest {
  businessName: string;
  businessType: string;
  contactEmail: string;
  contactPhone: string;
  tier: MerchantTier;
}

/**
 * Merchant application service.
 * Handles application intake and lifecycle state management.
 * All operations produce audit trail entries.
 */
export class ApplicationService {
  private applications: Map<string, MerchantApplication> = new Map();
  private auditLog: IAuditLog;

  constructor(auditLog: IAuditLog) {
    this.auditLog = auditLog;
  }

  async createApplication(
    request: CreateApplicationRequest,
  ): Promise<Result<MerchantApplication>> {
    const applicationId = `APP-${uuidv4()}`;
    const now = new Date().toISOString();

    const application: MerchantApplication = {
      applicationId,
      businessName: request.businessName,
      businessType: request.businessType,
      contactEmail: request.contactEmail,
      contactPhone: request.contactPhone,
      tier: request.tier,
      status: "pending",
      currentStep: "application_submitted",
      submittedAt: now,
      updatedAt: now,
    };

    this.applications.set(applicationId, application);

    await this.auditLog.log({
      actor: "onboarding-application",
      action: "application_submitted",
      domain: "onboarding",
      resourceType: "merchant_application",
      resourceId: applicationId,
      details: `New merchant application submitted: ${request.businessName}`,
      outcome: "success",
    });

    return { success: true, data: application };
  }

  async advanceStep(
    applicationId: string,
    nextStep: OnboardingStep,
  ): Promise<Result<MerchantApplication>> {
    const application = this.applications.get(applicationId);
    if (!application) {
      return { success: false, error: "Application not found" };
    }

    if (!canTransition(application.currentStep, nextStep)) {
      return {
        success: false,
        error: `Cannot transition from ${application.currentStep} to ${nextStep}`,
      };
    }

    const previousStep = application.currentStep;
    application.currentStep = nextStep;
    application.updatedAt = new Date().toISOString();

    if (nextStep === "approved") {
      application.status = "approved";
    } else {
      application.status = "under_review";
    }

    await this.auditLog.log({
      actor: "onboarding-application",
      action: "application_step_advanced",
      domain: "onboarding",
      resourceType: "merchant_application",
      resourceId: applicationId,
      details: `Step advanced from ${previousStep} to ${nextStep}`,
      outcome: "success",
    });

    return { success: true, data: { ...application } };
  }

  async getApplication(
    applicationId: string,
  ): Promise<Result<MerchantApplication>> {
    const application = this.applications.get(applicationId);
    if (!application) {
      return { success: false, error: "Application not found" };
    }
    return { success: true, data: { ...application } };
  }
}
