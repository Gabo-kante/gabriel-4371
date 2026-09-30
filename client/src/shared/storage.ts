import type { ZodType } from "zod";

const PREFIX = "snail.";

export const storageKeys = {
  users: "users",
  session: "session",
} as const;

export function readStorage<T>(key: string, schema: ZodType<T>, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false; // cuota llena o storage deshabilitado
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // nada que hacer
  }
}