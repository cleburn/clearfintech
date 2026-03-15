import { randomBytes } from "crypto";

/**
 * Generates a unique transaction ID combining a millisecond
 * timestamp with a random hex string (e.g. "txn_1710523200000_a3f1b9c2").
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const hex = randomBytes(4).toString("hex");
  return `txn_${timestamp}_${hex}`;
}
