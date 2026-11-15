import type { Request, Response, NextFunction } from "express";
import {
  registerSchema,
  loginSchema,
} from "./auth.validation";

import {
  registerUser,
  loginUser,
  rotateRefreshToken,
  logoutUser,
  refreshCookieName,
} from "./auth.service";

import prisma from "../../config/database";
import { env } from "../../config/env";

const isProduction = env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/api/v1/auth",
};

function sendError(
  res: Response,
  status: number,
  message: string,
) {
  return res.status(status).json({
    success: false,
    error: { message },
  });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid registration details.");
    }

    const user = await registerUser(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Organization and administrator account created.",
      data: { user },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("already exists")
    ) {
      return sendError(res, 409, error.message);
    }

    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return sendError(res, 400, "Invalid login details.");
    }

    const result = await loginUser(parsed.data);

    res.cookie(refreshCookieName, result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Invalid organization")
    ) {
      return sendError(res, 401, error.message);
    }

    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const oldToken = req.cookies?.[refreshCookieName];

    if (!oldToken) {
      return sendError(res, 401, "Refresh token is missing.");
    }

    const result = await rotateRefreshToken(oldToken);

    res.cookie(refreshCookieName, result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch {
    res.clearCookie(refreshCookieName, cookieOptions);
    return sendError(res, 401, "Session expired. Please log in again.");
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.[refreshCookieName];

    await logoutUser(token);
    res.clearCookie(refreshCookieName, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.auth) {
      return sendError(res, 401, "Authentication required.");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.auth.userId,
        organizationId: req.auth.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
      },
    });

    if (!user) {
      return sendError(res, 401, "User account is unavailable.");
    }

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}