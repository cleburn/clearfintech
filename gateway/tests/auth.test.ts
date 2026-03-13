import { generateToken, verifyToken } from "../src/auth";

const TEST_SECRET = "test-jwt-secret-that-is-long-enough-for-testing";

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

describe("Auth", () => {
  it("generates a valid JWT token", () => {
    const token = generateToken("MER-001", "merchant");
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  it("verifies a valid token and returns payload", () => {
    const token = generateToken("MER-001", "merchant");
    const payload = verifyToken(token);

    expect(payload.merchantId).toBe("MER-001");
    expect(payload.role).toBe("merchant");
  });

  it("throws on invalid token", () => {
    expect(() => verifyToken("invalid-token")).toThrow();
  });

  it("throws on tampered token", () => {
    const token = generateToken("MER-001", "merchant");
    const tampered = token.slice(0, -5) + "xxxxx";
    expect(() => verifyToken(tampered)).toThrow();
  });

  it("throws when JWT_SECRET is missing", () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => generateToken("MER-001", "merchant")).toThrow(
      "JWT_SECRET environment variable is required",
    );
    process.env.JWT_SECRET = original;
  });
});
