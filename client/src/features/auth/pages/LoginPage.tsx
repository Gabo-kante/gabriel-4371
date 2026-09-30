import { Link } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <AuthCard
      title="Bienvenido de nuevo"
      description="Inicia sesión para entrar a tu dashboard"
      footer={
        <>
          ¿No tienes cuenta?
          <Link to="/register" className="ml-1 font-medium text-emerald-700 underline">
            Regístrate
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}