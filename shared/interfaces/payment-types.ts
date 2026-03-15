/**
 * Masks a raw SSN string (e.g. "123456789" or "123-45-6789")
 * into the format ***-**-NNNN, exposing only the last four digits.
 */
export function maskSSN(rawSSN: string): string {
  const digits = rawSSN.replace(/\D/g, "");
  if (digits.length !== 9) {
    throw new Error("Invalid SSN: must contain exactly 9 digits");
  }
  return `***-**-${digits.slice(5)}`;
}
