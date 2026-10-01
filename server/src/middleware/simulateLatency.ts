import type { RequestHandler } from "express";

/** Monto que provoca una respuesta lenta. */
export const SLOW_AMOUNT = 13.13;
const DEFAULT_SLOW_MS = 12_000;

export const simulateLatency: RequestHandler = async (req, _res, next) => {
  if (req.body?.amount !== SLOW_AMOUNT) return next();
  const delay = Number(process.env.SNAILPAY_SLOW_MS ?? DEFAULT_SLOW_MS);
  await new Promise((resolve) => setTimeout(resolve, delay));
  next();
};