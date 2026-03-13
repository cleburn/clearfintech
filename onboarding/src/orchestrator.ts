import { Result } from "@shared/types/common";
import { MerchantApplication, MerchantAccount } from "@shared/types/merchant";
import { IComplianceVerification } from "@shared/interfaces/compliance-verification.interface";
import { IPaymentProvisioning } from "@shared/interfaces/payment-provisioning.interface";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";
import { ApplicationService, CreateApplicationRequest } from "./application";

/**
 * Onboarding orchestrator.
 * Coordinates the merchant onboarding workflow by calling through shared interfaces.
 * Never performs compliance verification or payment provisioning directly.
 * It orchestrates — it does not implement.
 */
export class OnboardingOrchestrator {
  private applicationService: ApplicationService;
  private complianceService: IComplianceVerification;
  private paymentService: IPaymentProvisioning;
  private auditLog: IAuditLog;

  constructor(
    auditLog: IAuditLog,
    complianceService: IComplianceVerification,
    paymentService: IPaymentProvisioning,
  ) {
    this.auditLog = auditLog;
    this.applicationService = new ApplicationService(auditLog);
    this.complianceService = complianceService;
    this.paymentService = paymentService;
  }

  async submitApplication(
    request: CreateApplicationRequest,
  ): Promise<Result<MerchantApplication>> {
    return this.applicationService.createApplication(request);
  }

  async processApplication(
    applicationId: string,
    customerTokenId: string,
  ): Promise<Result<MerchantAccount>> {
    const appResult =
      await this.applicationService.getApplication(applicationId);
    if (!appResult.success || !appResult.data) {
      return { success: false, error: "Application not found" };
    }
    const application = appResult.data;

    await this.applicationService.advanceStep(
      applicationId,
      "documents_collected",
    );

    const verifyResult = await this.complianceService.verifyIdentity({
      applicationId,
      businessName: application.businessName,
      contactEmail: application.contactEmail,
      customerTokenId,
    });

    if (!verifyResult.success || !verifyResult.data?.verified) {
      await this.auditLog.log({
        actor: "onboarding-orchestrator",
        action: "identity_verification_failed",
        domain: "onboarding",
        resourceType: "merchant_application",
        resourceId: applicationId,
        details: "Identity verification failed during onboarding",
        outcome: "failure",
      });
      return { success: false, error: "Identity verification failed" };
    }

    await this.applicationService.advanceStep(
      applicationId,
      "identity_verified",
    );

    const riskResult = await this.complianceService.assessRisk(applicationId);
    if (!riskResult.success) {
      return { success: false, error: "Risk assessment failed" };
    }

    await this.applicationService.advanceStep(applicationId, "risk_assessed");

    const provisionResult =
      await this.paymentService.provisionMerchantAccount({
        applicationId,
        businessName: application.businessName,
        tier: application.tier,
      });

    if (!provisionResult.success || !provisionResult.data) {
      return { success: false, error: "Account provisioning failed" };
    }

    await this.applicationService.advanceStep(
      applicationId,
      "account_provisioned",
    );
    await this.applicationService.advanceStep(applicationId, "approved");

    await this.auditLog.log({
      actor: "onboarding-orchestrator",
      action: "onboarding_completed",
      domain: "onboarding",
      resourceType: "merchant_application",
      resourceId: applicationId,
      details: `Merchant onboarding completed: ${application.businessName}`,
      outcome: "success",
    });

    return { success: true, data: provisionResult.data };
  }

  async getApplication(
    applicationId: string,
  ): Promise<Result<MerchantApplication>> {
    return this.applicationService.getApplication(applicationId);
  }
}
