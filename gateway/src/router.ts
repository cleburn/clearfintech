import { Router, Request, Response } from "express";
import { AuthenticatedRequest, authMiddleware } from "./auth";

/**
 * API router. Routes requests to appropriate domain handlers.
 * The gateway routes but does not implement business logic.
 * Domain-specific logic lives in the respective domains.
 */
export function createRouter(): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response): void => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  router.get(
    "/api/v1/merchant/profile",
    authMiddleware,
    (req: AuthenticatedRequest, res: Response): void => {
      res.json({
        merchantId: req.merchantId,
        role: req.role,
      });
    },
  );

  router.get(
    "/api/v1/merchant/transactions",
    authMiddleware,
    (req: AuthenticatedRequest, res: Response): void => {
      res.json({
        merchantId: req.merchantId,
        transactions: [],
      });
    },
  );

  router.get(
    "/api/v1/merchant/customers",
    authMiddleware,
    (req: AuthenticatedRequest, res: Response): void => {
      res.json({
        merchantId: req.merchantId,
        customers: [],
      });
    },
  );

  return router;
}
