import type { ErrorRequestHandler } from "express";
import { buildResponse, extractEcho } from "../services/snailpayResponse";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const echo = extractEcho(req.body);

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json(buildResponse({ status: "rejected", statusDetail: "invalid_request", echo }));
    return;
  }

  console.error(error); // el detalle interno solo va al log, nunca al cliente
  res.status(500).json(buildResponse({ status: "error", statusDetail: "internal_error", echo }));
};