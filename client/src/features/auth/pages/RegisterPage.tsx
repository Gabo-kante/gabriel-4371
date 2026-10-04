import { Link } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Es una cuenta de demostración. Empiezas con un saldo de $0.00"
      footer={
        <>
          ¿Ya tienes cuenta?
          <Link
            to="/login"
            className="ml-1 font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}