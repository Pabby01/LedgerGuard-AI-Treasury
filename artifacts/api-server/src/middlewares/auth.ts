import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.walletAddress) {
    res.status(401).json({
      error: {
        message: "Authentication required",
        status: 401,
      },
    });
    return;
  }
  next();
}
