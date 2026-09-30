import { Link } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Regístrate para empezar con tu saldo en $0"
      footer={
        <>
          ¿Ya tienes cuenta?
          <Link to="/login" className="ml-1 font-medium text-emerald-700 underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}