import { Link } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <AuthCard
      title="Bienvenido a la pista"
      description="Inicia sesión para ver tu saldo y el resumen de las carreras"
      footer={
        <>
          ¿Aún no tienes cuenta?
          <Link
            to="/register"
            className="ml-1 font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Crea una
          </Link>
        </>
      }
    >
      <LoginForm />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Aplicación de demostración: tu cuenta y tu saldo se guardan solo en este navegador.
      </p>
    </AuthCard>
  );
}