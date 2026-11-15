import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

import prisma from "../../config/database";
import { env } from "../../config/env";
import type { LoginInput, RegisterInput } from "./auth.validation";

const REFRESH_TOKEN_COOKIE = "deskops_refresh_token";

function refreshTokenExpiry(): Date {
  const days = Number.parseInt(env.REFRESH_TOKEN_EXPIRES_IN, 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createAccessToken(user: {
  id: string;
  organizationId: string;
  role: UserRole;
}): string {
  return jwt.sign(
    {
      organizationId: user.organizationId,
      role: user.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      subject: user.id,
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    },
  );
}

function createRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

async function saveRefreshToken(
  userId: string,
  organizationId: string,
  rawToken: string,
) {
  await prisma.refreshToken.create({
    data: {
      userId,
      organizationId,
      tokenHash: hashToken(rawToken),
      expiresAt: refreshTokenExpiry(),
    },
  });
}

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.organizationName,
      },
    });

    return tx.user.create({
      data: {
        organizationId: organization.id,
        name: input.name,
        email: input.email,
        passwordHash,
        role: UserRole.ORGANIZATION_ADMIN,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
      },
    });
  });

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      organizationId_email: {
        organizationId: input.organizationId,
        email: input.email,
      },
    },
  });

  if (!user || !user.isActive) {
    throw new Error("Invalid organization, email, or password.");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("Invalid organization, email, or password.");
  }

  const refreshToken = createRefreshToken();

  await saveRefreshToken(user.id, user.organizationId, refreshToken);

  return {
    accessToken: createAccessToken(user),
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
  };
}

export async function rotateRefreshToken(oldToken: string) {
  const oldTokenHash = hashToken(oldToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: oldTokenHash,
    },
    include: {
      user: true,
    },
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date() ||
    !storedToken.user.isActive
  ) {
    throw new Error("Invalid or expired refresh token.");
  }

  const newRefreshToken = createRefreshToken();

  const rotated = await prisma.$transaction(async (tx) => {
    const revokeResult = await tx.refreshToken.updateMany({
      where: {
        id: storedToken.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revokeResult.count !== 1) {
      throw new Error("Refresh token has already been used.");
    }

    await tx.refreshToken.create({
      data: {
        userId: storedToken.userId,
        organizationId: storedToken.organizationId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: refreshTokenExpiry(),
      },
    });

    return true;
  });

  if (!rotated) {
    throw new Error("Unable to refresh session.");
  }

  return {
    accessToken: createAccessToken(storedToken.user),
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(refreshToken?: string) {
  if (!refreshToken) return;

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export const refreshCookieName = REFRESH_TOKEN_COOKIE;