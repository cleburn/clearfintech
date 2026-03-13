import {
  generateCustomerToken,
  generatePaymentToken,
  storeTokenMapping,
  resolveToken,
  getTokenForInternal,
  clearTokenMappings,
} from "../src/tokenizer";

beforeEach(() => {
  clearTokenMappings();
});

describe("tokenizer", () => {
  it("generates customer tokens with CTK prefix", () => {
    const token = generateCustomerToken();
    expect(token).toMatch(/^CTK-/);
    expect(token.length).toBeGreaterThan(4);
  });

  it("generates payment tokens with PTK prefix", () => {
    const token = generatePaymentToken();
    expect(token).toMatch(/^PTK-/);
  });

  it("generates unique tokens on each call", () => {
    const token1 = generateCustomerToken();
    const token2 = generateCustomerToken();
    expect(token1).not.toBe(token2);
  });

  it("stores and resolves token mappings", () => {
    const token = "CTK-test-123";
    const internalId = "INT-abc-456";
    storeTokenMapping(token, internalId);

    expect(resolveToken(token)).toBe(internalId);
    expect(getTokenForInternal(internalId)).toBe(token);
  });

  it("returns undefined for unknown tokens", () => {
    expect(resolveToken("CTK-nonexistent")).toBeUndefined();
    expect(getTokenForInternal("INT-nonexistent")).toBeUndefined();
  });

  it("clears all token mappings", () => {
    storeTokenMapping("CTK-1", "INT-1");
    storeTokenMapping("CTK-2", "INT-2");
    clearTokenMappings();
    expect(resolveToken("CTK-1")).toBeUndefined();
    expect(resolveToken("CTK-2")).toBeUndefined();
  });
});
