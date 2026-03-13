import express from "express";
import { createRouter } from "./router";
import { RateLimiter } from "./rate-limiter";

export function createApp(): express.Application {
  const app = express();

  app.use(express.json());

  const rateLimiter = new RateLimiter({
    windowMs: 60_000,
    maxRequests: 100,
  });
  app.use(rateLimiter.middleware());

  app.use(createRouter());

  return app;
}

export function startServer(port?: number): ReturnType<express.Application["listen"]> {
  const app = createApp();
  const listenPort = port ?? parseInt(process.env.PORT ?? "3001", 10);
  return app.listen(listenPort);
}
