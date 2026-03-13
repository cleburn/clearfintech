import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 100;

export interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(options?: RateLimiterOptions) {
    this.windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
    this.maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  }

  private getClientKey(req: Request): string {
    return req.ip ?? req.socket.remoteAddress ?? "unknown";
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      this.cleanup();

      const key = this.getClientKey(req);
      const now = Date.now();
      const entry = this.store.get(key);

      if (!entry || entry.resetAt <= now) {
        this.store.set(key, {
          count: 1,
          resetAt: now + this.windowMs,
        });
        next();
        return;
      }

      entry.count += 1;

      if (entry.count > this.maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        res.status(429).json({
          error: "Too many requests",
          retryAfterSeconds: retryAfter,
        });
        return;
      }

      next();
    };
  }

  reset(): void {
    this.store.clear();
  }
}
