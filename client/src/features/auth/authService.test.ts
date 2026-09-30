import { describe, expect, it } from "vitest";
import { AuthError, getSession, login, logout, register } from "./authService";

const validUser = {
  fullName: "Ana Pérez",
  email: "ana@example.com",
  password: "Secreta123",
  confirmPassword: "Secreta123",
};

describe("authService", () => {
  it("registra al usuario y abre sesión", async () => {
    const user = await register(validUser);
    expect(user.email).toBe("ana@example.com");
    expect(getSession()).toEqual(user);
  });

  it("no guarda la contraseña en claro en localStorage", async () => {
    await register(validUser);
    const stored = window.localStorage.getItem("snail.users") ?? "";
    expect(stored).not.toContain("Secreta123");
    expect(stored).toContain("passwordHash");
  });

  it("rechaza un correo repetido sin distinguir mayúsculas", async () => {
    await register(validUser);
    await expect(register({ ...validUser, email: "ANA@Example.com" })).rejects.toMatchObject({
      code: "EMAIL_TAKEN",
    });
  });

  it("permite cerrar sesión y volver a entrar", async () => {
    await register(validUser);
    logout();
    expect(getSession()).toBeNull();

    const user = await login({ email: "ana@example.com", password: "Secreta123" });
    expect(user.fullName).toBe("Ana Pérez");
    expect(getSession()).toEqual(user);
  });

  it("da el mismo error con contraseña incorrecta y con correo inexistente", async () => {
    await register(validUser);
    logout();

    const wrongPassword = await login({ email: "ana@example.com", password: "mala" }).catch(
      (error: unknown) => error,
    );
    const unknownEmail = await login({ email: "nadie@example.com", password: "Secreta123" }).catch(
      (error: unknown) => error,
    );

    expect(wrongPassword).toBeInstanceOf(AuthError);
    expect(unknownEmail).toBeInstanceOf(AuthError);
    expect((wrongPassword as AuthError).message).toBe((unknownEmail as AuthError).message);
  });

  it("trata una sesión corrupta como sin sesión", () => {
    window.localStorage.setItem("snail.session", "{esto no es json");
    expect(getSession()).toBeNull();
  });

  it("trata una sesión que apunta a un usuario inexistente como sin sesión", () => {
    window.localStorage.setItem("snail.session", JSON.stringify({ userId: "fantasma" }));
    expect(getSession()).toBeNull();
  });
});