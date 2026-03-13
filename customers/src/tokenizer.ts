import { v4 as uuidv4 } from "uuid";
import { TOKEN_PREFIX } from "@shared/constants";

const tokenMap = new Map<string, string>();
const reverseMap = new Map<string, string>();

export function generateCustomerToken(): string {
  return `${TOKEN_PREFIX.CUSTOMER}-${uuidv4()}`;
}

export function generatePaymentToken(): string {
  return `${TOKEN_PREFIX.PAYMENT}-${uuidv4()}`;
}

export function storeTokenMapping(token: string, internalId: string): void {
  tokenMap.set(token, internalId);
  reverseMap.set(internalId, token);
}

export function resolveToken(token: string): string | undefined {
  return tokenMap.get(token);
}

export function getTokenForInternal(internalId: string): string | undefined {
  return reverseMap.get(internalId);
}

export function clearTokenMappings(): void {
  tokenMap.clear();
  reverseMap.clear();
}
