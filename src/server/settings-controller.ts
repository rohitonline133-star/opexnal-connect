import { Request, Response, Router } from "express";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";
import * as archiver from "archiver";
import sharp from "sharp";
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  ssl: process.env["NODE_ENV"] === "production" ? { rejectUnauthorized: false } : false,
});

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
    const geminiApiKey = process.env["GEMINI_API_KEY"];
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY missing");
    }
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Moderate this comment for hate speech or spam: "${commentText}". Return JSON { "flagged": boolean, "reason": string }.`,
    });
    res.json({ success: true, result: response.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
