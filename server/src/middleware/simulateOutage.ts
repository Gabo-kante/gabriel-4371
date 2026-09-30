import type { RequestHandler } from "express";
import { buildResponse, extractEcho } from "../services/snailpayResponse";

//Simula que SnailPay tiene un problema interno.
export const simulateOutage: RequestHandler = (req, res, next) => {
  const forced =
    process.env.SNAILPAY_FORCE_DOWN === "true" || req.header("X-Simulate-Outage") === "true";
  if (!forced) return next();

  res.setHeader("Retry-After", "30");
  res.status(503).json(
    buildResponse({
      status: "error",
      statusDetail: "service_unavailable",
      echo: extractEcho(req.body),
    }),
  );
};