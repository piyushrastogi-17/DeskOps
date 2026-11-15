import type { Request, Response, NextFunction } from "express";

export function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.auth?.organizationId) {
    return res.status(403).json({
      success: false,
      error: { message: "Organization context is required." },
    });
  }

  req.tenant = {
    organizationId: req.auth.organizationId,
  };

  return next();
}