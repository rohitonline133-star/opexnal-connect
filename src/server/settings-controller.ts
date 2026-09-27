import { Request, Response, Router } from "express";
import { opexAiGateway } from "./ai/gateway";
import Stripe from "stripe";
import * as archiver from "archiver";
import sharp from "sharp";
import { Pool } from "pg";
import crypto from "crypto";

let pool:
  | Pool
  | {
      query: () => Promise<{ rows: unknown[] }>;
      connect: () => Promise<{ query: () => Promise<{ rows: unknown[] }>; release: () => void }>;
    };
try {
  if (process.env["DATABASE_URL"]) {
    pool = new Pool({
      connectionString: process.env["DATABASE_URL"],
      ssl: process.env["NODE_ENV"] === "production" ? { rejectUnauthorized: false } : false,
    });
  } else {
    pool = {
      query: async () => ({ rows: [] }),
      connect: async () => ({ query: async () => ({ rows: [] }), release: () => {} }),
    };
  }
} catch {
  console.warn("DB not connected — mock active");
  pool = {
    query: async () => ({ rows: [] }),
    connect: async () => ({ query: async () => ({ rows: [] }), release: () => {} }),
  };
}

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env["STRIPE_SECRET_KEY"];
    if (!key) throw new Error("STRIPE_SECRET_KEY missing");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export const settingsRouter = Router();

settingsRouter.post("/ai/moderate-comment", async (req: Request, res: Response) => {
  try {
    const { commentText } = req.body;
    if (!commentText || typeof commentText !== "string") {
      return res.status(400).json({ error: "commentText is required" });
    }

    const modResult = await opexAiGateway.moderate(
      { content: commentText, contentType: "comment" },
      { endpoint: "/ai/moderate-comment" },
    );

    return res.json({
      success: true,
      result: JSON.stringify(modResult.result),
      flagged: modResult.result.flagged,
      provider: modResult.provider,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});
