import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../app";

const ENDPOINT = "/api/snailpay/charges";

const EXPECTED_FIELDS = [
  "id", "status", "status_detail", "transaction_amount", "date_created",
  "authorization_code", "reference", "payer_id", "payer_email", "card_number", "cvv",
].sort();

const approvedPayload = {
  card_number: "1234123412341234",
  expiration_date: "12/26",
  cvv: "543",
  cardholder_name: "Ana Pérez",
  amount: 250,
  payer_id: "user-1",
  payer_email: "ana@example.com",
};

afterEach(() => {
  delete process.env.SNAILPAY_FORCE_DOWN;
});

describe("POST /api/snailpay/charges", () => {
  it("aprueba el cobro con los datos de éxito", async () => {
    const res = await request(createApp()).post(ENDPOINT).send(approvedPayload);

    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(EXPECTED_FIELDS);
    expect(res.body).toMatchObject({
      status: "approved",
      status_detail: "accredited",
      transaction_amount: 250,
      payer_id: "user-1",
      payer_email: "ana@example.com",
      card_number: "1234123412341234",
      cvv: "543",
    });
    expect(res.body.authorization_code).toMatch(/^\d{6}$/);
    expect(res.body.reference).toMatch(/^SP-[0-9A-F]{10}$/);
  });

  it.each([
    ["tarjeta con menos de 16 dígitos", { card_number: "1234" }, 400, "invalid_card_number"],
    ["fecha con mes inválido", { expiration_date: "13/26" }, 400, "invalid_expiration_date"],
    ["CVV demasiado corto", { cvv: "12" }, 400, "invalid_security_code"],
    ["nombre vacío", { cardholder_name: "   " }, 400, "invalid_cardholder_name"],
    ["monto en cero", { amount: 0 }, 400, "invalid_amount"],
    ["monto negativo", { amount: -5 }, 400, "invalid_amount"],
    ["monto como texto", { amount: "100" }, 400, "invalid_amount"],
    ["correo inválido", { payer_email: "no-es-correo" }, 400, "invalid_payer"],
    ["CVV incorrecto en la tarjeta de éxito", { cvv: "999" }, 402, "bad_security_code"],
    ["fecha distinta en la tarjeta de éxito", { expiration_date: "11/27" }, 402, "bad_expiration_date"],
    ["tarjeta rechazada", { card_number: "4000000000000002" }, 402, "card_declined"],
    ["fondos insuficientes", { card_number: "4000000000009995" }, 402, "insufficient_funds"],
    ["tarjeta desconocida", { card_number: "4111111111111111" }, 402, "card_declined"],
    ["tarjeta vencida", { card_number: "4111111111111111", expiration_date: "01/20" }, 402, "expired_card"],
  ])("rechaza sin autorizar: %s", async (_caso, overrides, httpStatus, detail) => {
    const res = await request(createApp()).post(ENDPOINT).send({ ...approvedPayload, ...overrides });

    expect(res.status).toBe(httpStatus);
    expect(Object.keys(res.body).sort()).toEqual(EXPECTED_FIELDS);
    expect(res.body.status).toBe("rejected");
    expect(res.body.status_detail).toBe(detail);
    expect(res.body.authorization_code).toBeNull();
  });

  it("responde 400 con la misma estructura si el JSON está mal formado", async () => {
    const res = await request(createApp())
      .post(ENDPOINT)
      .set("Content-Type", "application/json")
      .send("{esto no es json");

    expect(res.status).toBe(400);
    expect(Object.keys(res.body).sort()).toEqual(EXPECTED_FIELDS);
    expect(res.body.status_detail).toBe("invalid_request");
  });

  it("simula caída del sistema con el header X-Simulate-Outage y no aprueba nada", async () => {
    const res = await request(createApp())
      .post(ENDPOINT)
      .set("X-Simulate-Outage", "true")
      .send(approvedPayload);

    expect(res.status).toBe(503);
    expect(res.headers["retry-after"]).toBe("30");
    expect(Object.keys(res.body).sort()).toEqual(EXPECTED_FIELDS);
    expect(res.body).toMatchObject({ status: "error", status_detail: "service_unavailable" });
    expect(res.body.authorization_code).toBeNull();
  });

  it("simula caída del sistema con la variable SNAILPAY_FORCE_DOWN", async () => {
    process.env.SNAILPAY_FORCE_DOWN = "true";
    const res = await request(createApp()).post(ENDPOINT).send(approvedPayload);

    expect(res.status).toBe(503);
    expect(res.body.status).toBe("error");
    expect(res.body.authorization_code).toBeNull();
  });

  it("limita a 30 cobros por minuto", async () => {
    const app = createApp();
    for (let i = 0; i < 30; i++) {
      await request(app).post(ENDPOINT).send(approvedPayload);
    }
    const res = await request(app).post(ENDPOINT).send(approvedPayload);

    expect(res.status).toBe(429);
    expect(res.body.status_detail).toBe("too_many_requests");
  });
});