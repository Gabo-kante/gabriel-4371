import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

vi.mock("@/features/auth/useAuth");
const mockedUseAuth = vi.mocked(useAuth);

function setUser(user: { id: string; fullName: string; email: string } | null) {
  mockedUseAuth.mockReturnValue({
    user,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  });
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<p>pantalla de login</p>} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>pantalla de dashboard</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

const ana = { id: "1", fullName: "Ana", email: "ana@example.com" };

describe("route guards", () => {
  it("sin sesión, /dashboard redirige al login", () => {
    setUser(null);
    renderAt("/dashboard");
    expect(screen.getByText("pantalla de login")).toBeInTheDocument();
  });

  it("con sesión, /dashboard se muestra", () => {
    setUser(ana);
    renderAt("/dashboard");
    expect(screen.getByText("pantalla de dashboard")).toBeInTheDocument();
  });

  it("con sesión, /login redirige al dashboard", () => {
    setUser(ana);
    renderAt("/login");
    expect(screen.getByText("pantalla de dashboard")).toBeInTheDocument();
  });

  it("sin sesión, /login se muestra", () => {
    setUser(null);
    renderAt("/login");
    expect(screen.getByText("pantalla de login")).toBeInTheDocument();
  });
});