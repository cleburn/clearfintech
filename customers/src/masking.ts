import { MASK_CHAR, MASK_VISIBLE_CHARS } from "@shared/constants";

export function maskValue(value: string, visibleChars?: number): string {
  const visible = visibleChars ?? MASK_VISIBLE_CHARS;
  if (value.length <= visible) {
    return MASK_CHAR.repeat(value.length);
  }
  const masked = MASK_CHAR.repeat(value.length - visible);
  return masked + value.slice(-visible);
}

export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) {
    return maskValue(email);
  }
  const local = email.substring(0, atIndex);
  const domain = email.substring(atIndex);
  const visibleLocal = Math.min(2, local.length);
  const maskedLocal =
    local.substring(0, visibleLocal) + MASK_CHAR.repeat(local.length - visibleLocal);
  return maskedLocal + domain;
}

export function maskName(firstName: string, lastName: string): string {
  const maskedFirst =
    firstName.charAt(0) + MASK_CHAR.repeat(firstName.length - 1);
  const maskedLast =
    lastName.charAt(0) + MASK_CHAR.repeat(lastName.length - 1);
  return `${maskedFirst} ${maskedLast}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) {
    return MASK_CHAR.repeat(phone.length);
  }
  return MASK_CHAR.repeat(digits.length - 4) + digits.slice(-4);
}

export function maskAccountNumber(accountNumber: string): string {
  return maskValue(accountNumber, 4);
}

export function maskSSN(_ssn: string): string {
  return "***-**-****";
}
