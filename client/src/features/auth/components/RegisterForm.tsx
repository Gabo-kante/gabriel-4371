import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthError } from "../authService";
import { registerSchema, type RegisterInput } from "../schemas";
import { useAuth } from "../useAuth";
import { FormField } from "./FormField";

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerUser(values);
      toast.success("Cuenta creada correctamente");
    } catch (error) {
      if (error instanceof AuthError && error.code === "EMAIL_TAKEN") {
        setError("email", { message: error.message });
      } else {
        setFormError(error instanceof AuthError ? error.message : "Ocurrió un error inesperado");
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField id="fullName" label="Nombre completo" autoComplete="name"
        error={errors.fullName?.message} {...register("fullName")} />
      <FormField id="email" label="Correo electrónico" type="email" autoComplete="email"
        error={errors.email?.message} {...register("email")} />
      <FormField id="password" label="Contraseña" type="password" autoComplete="new-password"
        error={errors.password?.message} {...register("password")} />
      <FormField id="confirmPassword" label="Confirmar contraseña" type="password"
        autoComplete="new-password" error={errors.confirmPassword?.message}
        {...register("confirmPassword")} />

      {formError && (
        <p role="alert" className="text-sm text-destructive">{formError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}