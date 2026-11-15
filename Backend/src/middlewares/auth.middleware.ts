import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";

interface AccessTokenPayload {
  sub: string;
  organizationId: string;
  role: UserRole;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { message: "Authentication token required." },
    });
  }

  const token = authorization.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET,
    ) as AccessTokenPayload;

    if (
      !decoded.sub ||
      !decoded.organizationId ||
      !Object.values(UserRole).includes(decoded.role)
    ) {
      return res.status(401).json({
        success: false,
        error: { message: "Invalid authentication token." },
      });
    }

    req.auth = {
      userId: decoded.sub,
      organizationId: decoded.organizationId,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid or expired authentication token." },
    });
  }
}

export function allowRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required." },
      });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({
        success: false,
        error: { message: "You do not have permission to perform this action." },
      });
    }

    next();
  };
}