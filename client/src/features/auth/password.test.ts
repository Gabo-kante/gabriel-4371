import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

const FAST_ITERATIONS = 1_000;

describe("password hashing", () => {
  it("no guarda la contraseña en claro", async () => {
    const record = await hashPassword("Secreta123", FAST_ITERATIONS);
    expect(JSON.stringify(record)).not.toContain("Secreta123");
  });

  it("genera hashes distintos para la misma contraseña (sal aleatoria)", async () => {
    const first = await hashPassword("Secreta123", FAST_ITERATIONS);
    const second = await hashPassword("Secreta123", FAST_ITERATIONS);
    expect(first.salt).not.toBe(second.salt);
    expect(first.passwordHash).not.toBe(second.passwordHash);
  });

  it("verifica una contraseña correcta", async () => {
    const record = await hashPassword("Secreta123", FAST_ITERATIONS);
    await expect(verifyPassword("Secreta123", record)).resolves.toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const record = await hashPassword("Secreta123", FAST_ITERATIONS);
    await expect(verifyPassword("otra-cosa", record)).resolves.toBe(false);
  });
});