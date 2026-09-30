import type { RequestHandler } from "express";
import { processCharge } from "../services/snailpayService";

export const createCharge: RequestHandler = (req, res) => {
  const { httpStatus, body } = processCharge(req.body);
  res.status(httpStatus).json(body);
};