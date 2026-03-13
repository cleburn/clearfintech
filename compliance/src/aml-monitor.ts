import { AML_THRESHOLDS } from "@shared/constants";
import { IAuditLog } from "@shared/interfaces/audit-log.interface";

export interface AmlAlert {
  alertId: string;
  merchantId: string;
  triggerType: "single_transaction" | "cumulative_daily" | "velocity_change";
  amount: number;
  threshold: number;
  createdAt: string;
}

interface DailyAccumulator {
  date: string;
  total: number;
  count: number;
}

/**
 * AML monitoring service. Checks transactions against regulatory thresholds.
 * Alerts are generated internally within the compliance domain.
 * Alert details and existence never leave this domain boundary.
 */
export class AmlMonitor {
  private alerts: AmlAlert[] = [];
  private dailyTotals: Map<string, DailyAccumulator> = new Map();
  private auditLog: IAuditLog;

  constructor(auditLog: IAuditLog) {
    this.auditLog = auditLog;
  }

  async checkTransaction(
    merchantId: string,
    transactionId: string,
    amount: number,
  ): Promise<{ flagged: boolean; alertCount: number }> {
    let flagged = false;
    const alertsBefore = this.alerts.length;

    if (amount >= AML_THRESHOLDS.SINGLE_TRANSACTION) {
      this.alerts.push({
        alertId: `AML-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        merchantId,
        triggerType: "single_transaction",
        amount,
        threshold: AML_THRESHOLDS.SINGLE_TRANSACTION,
        createdAt: new Date().toISOString(),
      });
      flagged = true;
    }

    const today = new Date().toISOString().split("T")[0];
    const accKey = `${merchantId}:${today}`;
    const accumulator = this.dailyTotals.get(accKey) ?? {
      date: today,
      total: 0,
      count: 0,
    };
    accumulator.total += amount;
    accumulator.count += 1;
    this.dailyTotals.set(accKey, accumulator);

    if (accumulator.total >= AML_THRESHOLDS.CUMULATIVE_DAILY) {
      this.alerts.push({
        alertId: `AML-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        merchantId,
        triggerType: "cumulative_daily",
        amount: accumulator.total,
        threshold: AML_THRESHOLDS.CUMULATIVE_DAILY,
        createdAt: new Date().toISOString(),
      });
      flagged = true;
    }

    await this.auditLog.log({
      actor: "aml-monitor",
      action: "transaction_screened",
      domain: "compliance",
      resourceType: "transaction",
      resourceId: transactionId,
      details: flagged
        ? "Transaction flagged by AML screening"
        : "Transaction passed AML screening",
      outcome: "success",
    });

    const newAlerts = this.alerts.length - alertsBefore;
    return { flagged, alertCount: newAlerts };
  }

  getAlertCount(): number {
    return this.alerts.length;
  }

  clearDailyAccumulators(): void {
    this.dailyTotals.clear();
  }
}
