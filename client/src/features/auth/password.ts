const DEFAULT_ITERATIONS = 310_000;
const encoder = new TextEncoder();

export interface PasswordRecord {
  passwordHash: string;
  salt: string;
  iterations: number;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(
  password: string,
  iterations = DEFAULT_ITERATIONS,
): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, iterations);
  return { passwordHash: toBase64(hash), salt: toBase64(salt), iterations };
}

export async function verifyPassword(password: string, record: PasswordRecord): Promise<boolean> {
  const hash = await derive(password, fromBase64(record.salt), record.iterations);
  const expected = fromBase64(record.passwordHash);
  if (hash.length !== expected.length) return false;
  // comparación en tiempo constante
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash[i] ^ expected[i];
  return diff === 0;
}