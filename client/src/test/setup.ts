import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

beforeEach(() => {
  window.localStorage.clear(); // cada prueba empieza con el storage vacío
});

afterEach(() => {
  cleanup();
});