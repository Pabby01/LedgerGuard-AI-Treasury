import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

export type SessionRole = "admin" | "operator";

declare module "express-session" {
  interface SessionData {
    nonce?: string;
    nonceIssuedAt?: number;
    walletAddress?: string;
    role?: SessionRole;
    payloadChallenge?: {
      txId: number;
      token: string;
      issuedAt: number;
      expiresAt: number;
    };
  }
}

const parseAddressList = (value: string | undefined) =>
  new Set(
    (value ?? "")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean),
  );

const adminWalletAllowlist = parseAddressList(process.env.ADMIN_WALLET_ADDRESSES);

export function resolveRoleForWallet(address: string): SessionRole {
  if (adminWalletAllowlist.size === 0 || adminWalletAllowlist.has(address)) {
    return "admin";
  }

  return "operator";
}

function getRateLimitKey(req: Request) {
  const requestIp = Reflect.get(req, "ip") as string;
  return req.session?.walletAddress ?? ipKeyGenerator(requestIp);
}

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
});

export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
});

export function requireRole(requiredRole: SessionRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.session?.role ?? "operator";

    if (requiredRole === "admin" && role !== "admin") {
      res.status(403).json({
        error: {
          message: "Admin access required",
          status: 403,
        },
      });
      return;
    }

    next();
  };
}

export function issuePayloadChallenge(session: Request["session"], txId: number) {
  const token = crypto.randomBytes(16).toString("hex");
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 10 * 60 * 1000;

  session.payloadChallenge = {
    txId,
    token,
    issuedAt,
    expiresAt,
  };

  return session.payloadChallenge;
}

export function validatePayloadChallenge(
  session: Request["session"],
  txId: number,
  token?: string,
) {
  const challenge = session.payloadChallenge;
  if (!challenge) {
    return { ok: false, reason: "Missing payload challenge" } as const;
  }

  if (challenge.txId !== txId) {
    return { ok: false, reason: "Payload challenge does not match transaction" } as const;
  }

  if (challenge.expiresAt < Date.now()) {
    return { ok: false, reason: "Payload challenge expired" } as const;
  }

  if (!token || token !== challenge.token) {
    return { ok: false, reason: "Invalid payload challenge token" } as const;
  }

  delete session.payloadChallenge;
  return { ok: true } as const;
}