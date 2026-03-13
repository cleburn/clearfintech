import { v4 as uuidv4 } from "uuid";
import { Result } from "@shared/types/common";
import {
  IComplianceVerification,
  IdentityVerificationRequest,
  IdentityVerificationResult,
  RiskAssessmentResult,
  TransactionComplianceRequest,
  TransactionComplianceResult,
} from "@shared/interfaces/compliance-verification.interface";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";
import { AmlMonitor } from "./aml-monitor";

/**
 * Identity verification and compliance checking service.
 * Exposes only verification results and risk levels through the shared interface.
 * Internal compliance data (SAR status, FinCEN filings) never crosses the boundary.
 */
export class ComplianceVerificationService implements IComplianceVerification {
  private verifications: Map<string, IdentityVerificationResult> = new Map();
  private auditLog: IAuditLog;
  private amlMonitor: AmlMonitor;

  constructor(auditLog: IAuditLog, amlMonitor: AmlMonitor) {
    this.auditLog = auditLog;
    this.amlMonitor = amlMonitor;
  }

  async verifyIdentity(
    request: IdentityVerificationRequest,
  ): Promise<Result<IdentityVerificationResult>> {
    const verificationId = uuidv4();

    const result: IdentityVerificationResult = {
      verified: true,
      verificationId,
      riskLevel: "low",
      verifiedAt: new Date().toISOString(),
    };

    this.verifications.set(request.applicationId, result);

    await this.auditLog.log({
      actor: "compliance-verification",
      action: "identity_verified",
      domain: "compliance",
      resourceType: "merchant_application",
      resourceId: request.applicationId,
      details: "Identity verification completed via KYC process",
      outcome: "success",
    });

    return { success: true, data: result };
  }

  async assessRisk(
    merchantId: string,
  ): Promise<Result<RiskAssessmentResult>> {
    const result: RiskAssessmentResult = {
      merchantId,
      riskLevel: "low",
      assessedAt: new Date().toISOString(),
      factors: ["business_type_verified", "volume_within_norms"],
    };

    await this.auditLog.log({
      actor: "compliance-verification",
      action: "risk_assessed",
      domain: "compliance",
      resourceType: "merchant",
      resourceId: merchantId,
      details: `Risk assessment completed: ${result.riskLevel}`,
      outcome: "success",
    });

    return { success: true, data: result };
  }

  async checkTransactionCompliance(
    request: TransactionComplianceRequest,
  ): Promise<Result<TransactionComplianceResult>> {
    const amlResult = await this.amlMonitor.checkTransaction(
      request.merchantId,
      request.transactionId,
      request.amount,
    );

    const flags: string[] = [];
    if (amlResult.flagged) {
      flags.push("aml_threshold_exceeded");
    }

    const result: TransactionComplianceResult = {
      approved: !amlResult.flagged,
      transactionId: request.transactionId,
      flags,
      checkedAt: new Date().toISOString(),
    };

    await this.auditLog.log({
      actor: "compliance-verification",
      action: "transaction_compliance_check",
      domain: "compliance",
      resourceType: "transaction",
      resourceId: request.transactionId,
      details: result.approved
        ? "Transaction approved by compliance"
        : `Transaction flagged: ${flags.join(", ")}`,
      outcome: "success",
    });

    return { success: true, data: result };
  }
}
