import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { createCharge } from "../controllers/snailpayController";
import { simulateOutage } from "../middleware/simulateOutage";
import { buildResponse, extractEcho } from "../services/snailpayResponse";
import { simulateLatency } from "../middleware/simulateLatency";

export function createSnailPayRouter() {
  const router = Router();

  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json(
        buildResponse({
          status: "error",
          statusDetail: "too_many_requests",
          echo: extractEcho(req.body),
        }),
      );
    },
  });

  router.post("/charges", limiter, simulateOutage, simulateLatency, createCharge);
  return router;
}