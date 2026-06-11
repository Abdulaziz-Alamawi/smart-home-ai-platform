import { randomUUID } from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";

import { env } from "../config/env";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as SignOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  // A unique jti guarantees each refresh token string is distinct even when
  // multiple tokens are issued within the same second (prevents collisions on
  // the unique RefreshToken.token column during rapid login -> refresh flows).
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
    jwtid: randomUUID(),
  } as SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
}
