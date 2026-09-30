import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { AuthError } from "../authService";
import { loginSchema, type LoginInput } from "../schemas";
import { useAuth } from "../useAuth";
import { FormField } from "./FormField";

export function LoginForm() {
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), mode: "onTouched" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : "Ocurrió un error inesperado");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField id="email" label="Correo electrónico" type="email" autoComplete="email"
        error={errors.email?.message} {...register("email")} />
      <FormField id="password" label="Contraseña" type="password" autoComplete="current-password"
        error={errors.password?.message} {...register("password")} />

      {formError && (
        <p role="alert" className="text-sm text-destructive">{formError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}