import { z } from "zod";
import { readStorage, removeStorage, storageKeys, writeStorage } from "@/shared/storage";
import { hashPassword, verifyPassword } from "./password";
import {
  storedUserSchema,
  type LoginInput,
  type RegisterInput,
  type SessionUser,
  type StoredUser,
} from "./schemas";

type AuthErrorCode = "EMAIL_TAKEN" | "INVALID_CREDENTIALS" | "STORAGE_UNAVAILABLE";

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

const usersSchema = z.array(storedUserSchema);
const sessionSchema = z.object({ userId: z.string() }).nullable();

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const loadUsers = () => readStorage(storageKeys.users, usersSchema, []);

function toSessionUser({ id, fullName, email }: StoredUser): SessionUser {
  return { id, fullName, email };
}

export async function register(input: RegisterInput): Promise<SessionUser> {
  const email = normalizeEmail(input.email);
  const users = loadUsers();

  if (users.some((user) => user.email === email)) {
    throw new AuthError("EMAIL_TAKEN", "Ya existe una cuenta con ese correo");
  }

  const passwordRecord = await hashPassword(input.password);
  const user: StoredUser = {
    id: crypto.randomUUID(),
    fullName: input.fullName.trim(),
    email,
    ...passwordRecord,
    createdAt: new Date().toISOString(),
  };

  const saved =
    writeStorage(storageKeys.users, [...users, user]) &&
    writeStorage(storageKeys.session, { userId: user.id });
  if (!saved) {
    throw new AuthError("STORAGE_UNAVAILABLE", "No se pudo guardar la información en el navegador");
  }
  return toSessionUser(user);
}

export async function login(input: LoginInput): Promise<SessionUser> {
  const email = normalizeEmail(input.email);
  const user = loadUsers().find((candidate) => candidate.email === email);

  // Mismo mensaje para correo inexistente y contraseña incorrecta
  const invalid = new AuthError("INVALID_CREDENTIALS", "Correo o contraseña incorrectos");
  if (!user) throw invalid;
  if (!(await verifyPassword(input.password, user))) throw invalid;

  if (!writeStorage(storageKeys.session, { userId: user.id })) {
    throw new AuthError("STORAGE_UNAVAILABLE", "No se pudo guardar la sesión en el navegador");
  }
  return toSessionUser(user);
}

export function logout(): void {
  removeStorage(storageKeys.session);
}

export function getSession(): SessionUser | null {
  const session = readStorage(storageKeys.session, sessionSchema, null);
  if (!session) return null;
  const user = loadUsers().find((candidate) => candidate.id === session.userId);
  return user ? toSessionUser(user) : null;
}