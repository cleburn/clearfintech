import { createApp } from "../src/server";
import { generateToken } from "../src/auth";
import http from "http";

const TEST_SECRET = "test-jwt-secret-for-gateway-integration";

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

function makeRequest(
  server: http.Server,
  path: string,
  headers?: Record<string, string>,
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const address = server.address();
    if (!address || typeof address === "string") {
      reject(new Error("Server not listening"));
      return;
    }

    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: address.port,
      path,
      method: "GET",
      headers,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () =>
        resolve({ statusCode: res.statusCode ?? 0, body: data }),
      );
    });

    req.on("error", reject);
    req.end();
  });
}

describe("Gateway integration", () => {
  let server: http.Server;

  beforeAll((done) => {
    const app = createApp();
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it("serves all merchant API endpoints with authentication", async () => {
    const token = generateToken("MER-GW-001", "merchant");
    const authHeaders = { Authorization: `Bearer ${token}` };

    const profile = await makeRequest(
      server,
      "/api/v1/merchant/profile",
      authHeaders,
    );
    expect(profile.statusCode).toBe(200);

    const transactions = await makeRequest(
      server,
      "/api/v1/merchant/transactions",
      authHeaders,
    );
    expect(transactions.statusCode).toBe(200);

    const customers = await makeRequest(
      server,
      "/api/v1/merchant/customers",
      authHeaders,
    );
    expect(customers.statusCode).toBe(200);
  });

  it("rejects requests with expired or invalid tokens", async () => {
    const response = await makeRequest(
      server,
      "/api/v1/merchant/profile",
      { Authorization: "Bearer invalid.token.here" },
    );
    expect(response.statusCode).toBe(401);
  });

  it("health endpoint does not require authentication", async () => {
    const response = await makeRequest(server, "/health");
    expect(response.statusCode).toBe(200);
  });
});
