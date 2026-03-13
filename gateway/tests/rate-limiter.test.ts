import { RateLimiter } from "../src/rate-limiter";
import { Request, Response } from "express";

function createMockReq(ip?: string): Partial<Request> {
  return {
    ip: ip ?? "127.0.0.1",
    socket: { remoteAddress: ip ?? "127.0.0.1" } as Request["socket"],
  };
}

function createMockRes(): Partial<Response> & { statusCode?: number; body?: unknown } {
  const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
  res.status = jest.fn().mockReturnValue(res) as unknown as Response["status"];
  res.json = jest.fn().mockImplementation((data) => {
    res.body = data;
    return res;
  }) as unknown as Response["json"];
  return res;
}

describe("RateLimiter", () => {
  it("allows requests within the limit", () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 5 });
    const middleware = limiter.middleware();
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks requests exceeding the limit", () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 3 });
    const middleware = limiter.middleware();
    const req = createMockReq();
    const next = jest.fn();

    for (let i = 0; i < 3; i++) {
      const res = createMockRes();
      middleware(req as Request, res as Response, next);
    }

    expect(next).toHaveBeenCalledTimes(3);

    const blockedRes = createMockRes();
    middleware(req as Request, blockedRes as Response, jest.fn());
    expect(blockedRes.status).toHaveBeenCalledWith(429);
  });

  it("allows requests from different IPs independently", () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 1 });
    const middleware = limiter.middleware();

    const req1 = createMockReq("1.1.1.1");
    const req2 = createMockReq("2.2.2.2");
    const next = jest.fn();

    middleware(req1 as Request, createMockRes() as Response, next);
    middleware(req2 as Request, createMockRes() as Response, next);

    expect(next).toHaveBeenCalledTimes(2);
  });

  it("resets the store", () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 1 });
    const middleware = limiter.middleware();
    const req = createMockReq();
    const next = jest.fn();

    middleware(req as Request, createMockRes() as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    limiter.reset();

    middleware(req as Request, createMockRes() as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
