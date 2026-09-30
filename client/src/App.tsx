import { Navigate, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { useAuth } from "@/features/auth/useAuth";

export default function App() {
  const { user, logout } = useAuth();

  if (user) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Hola, {user.fullName}</h1>
        <Button className="mt-4" onClick={logout}>Cerrar sesión</Button>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}