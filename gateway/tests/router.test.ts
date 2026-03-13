import { createApp } from "../src/server";
import { generateToken } from "../src/auth";
import http from "http";

const TEST_SECRET = "test-jwt-secret-for-router-tests";

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

describe("Router", () => {
  let server: http.Server;

  beforeAll((done) => {
    const app = createApp();
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it("returns health check", async () => {
    const response = await makeRequest(server, "/health");
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("healthy");
  });

  it("rejects unauthenticated requests to protected routes", async () => {
    const response = await makeRequest(server, "/api/v1/merchant/profile");
    expect(response.statusCode).toBe(401);
  });

  it("accepts authenticated requests", async () => {
    const token = generateToken("MER-TEST-001", "merchant");
    const response = await makeRequest(server, "/api/v1/merchant/profile", {
      Authorization: `Bearer ${token}`,
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.merchantId).toBe("MER-TEST-001");
  });
});
