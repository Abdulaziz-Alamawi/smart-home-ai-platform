import { addDays } from "../../utils/time";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashPassword, verifyPassword } from "../../utils/password";
import {
  JwtPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { LoginInput, RegisterInput } from "./auth.schema";

function toPayload(user: { id: string; email: string; role: string }): JwtPayload {
  return { sub: user.id, email: user.email, role: user.role };
}

function publicUser(u: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
}) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    avatarUrl: u.avatarUrl,
  };
}

async function issueTokens(user: { id: string; email: string; role: string }) {
  const payload = toPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: addDays(new Date(), 7),
    },
  });
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict("Email is already registered");

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        settings: { create: {} },
      },
    });
    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) throw ApiError.unauthorized("Invalid credentials");

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw ApiError.unauthorized("Invalid credentials");

    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid refresh token");
    }
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized("Refresh token expired or revoked");
    }
    // Rotate: revoke the old token and issue a new pair.
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true },
    });
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw ApiError.unauthorized("User no longer active");
    return issueTokens(user);
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
    return { success: true };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
    if (!user) throw ApiError.notFound("User not found");
    return { ...publicUser(user), settings: user.settings, isActive: user.isActive };
  },
};
