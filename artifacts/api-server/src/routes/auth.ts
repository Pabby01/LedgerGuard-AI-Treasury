import { Router } from "express";
import crypto from "crypto";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { SignInBody, GetNonceResponse, GetMeResponse } from "@workspace/api-zod";
import { authRateLimiter, resolveRoleForWallet } from "../middlewares/security";

const router = Router();

router.use(authRateLimiter);

// Extend session type for TS
declare module "express-session" {
  interface SessionData {
    nonce?: string;
    walletAddress?: string;
  }
}

router.get("/auth/nonce", (req, res) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  req.session.nonce = nonce;
  req.session.nonceIssuedAt = Date.now();
  res.json(GetNonceResponse.parse({ nonce }));
});

router.post("/auth/signin", async (req, res) => {
  const parsed = SignInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, signature, publicKey: pubKeyStr } = parsed.data;

  // Verify nonce is in the message
  if (!req.session.nonce || !message.includes(req.session.nonce)) {
    res.status(401).json({ error: "Invalid nonce in message" });
    return;
  }

  if (req.session.nonceIssuedAt && Date.now() - req.session.nonceIssuedAt > 10 * 60 * 1000) {
    delete req.session.nonce;
    delete req.session.nonceIssuedAt;
    res.status(401).json({ error: "Nonce expired" });
    return;
  }

  try {
    const pubKey = new PublicKey(pubKeyStr);
    const signatureUint8 = bs58.decode(signature);
    const messageUint8 = new TextEncoder().encode(message);

    const verified = nacl.sign.detached.verify(
      messageUint8,
      signatureUint8,
      pubKey.toBytes()
    );

    if (!verified) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    req.session.walletAddress = pubKey.toBase58();
    req.session.role = resolveRoleForWallet(req.session.walletAddress);
    delete req.session.nonce;
    delete req.session.nonceIssuedAt;
    res.json({ status: "ok" });
  } catch (err) {
    res.status(401).json({ error: "Verification failed" });
  }
});

router.post("/auth/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to sign out" });
      return;
    }
    res.sendStatus(204);
  });
});

router.get("/auth/me", (req, res) => {
  if (!req.session.walletAddress) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(GetMeResponse.parse({ address: req.session.walletAddress }));
});

export default router;
