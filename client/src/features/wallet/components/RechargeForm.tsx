import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/shared/FormField";
import { rechargeFormSchema, type RechargeFormValues } from "../rechargeSchema";
import type { ChargeOutcome } from "../snailpayClient";
import { useWallet } from "../useWallet"
import { WalletError, type RechargeResult } from "../walletService";
import { ApprovalPanel } from "./ApprovalPanel";

interface Failure {
  title: string;
  message: string;
}

const FAILURE_TITLES = {
  rejected: "Cobro rechazado",
  unavailable: "SnailPay no está disponible",
  timeout: "No pudimos confirmar la operación",
  network: "Sin conexión con SnailPay",
} as const;

function describeFailure(outcome: Exclude<ChargeOutcome, { kind: "approved" }>): Failure {
  return { title: FAILURE_TITLES[outcome.kind], message: outcome.message };
}

export function RechargeForm({ onClose }: { onClose: () => void }) {
  const { wallet, recharge } = useWallet();
  const [approved, setApproved] = useState<RechargeResult | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [simulateOutage, setSimulateOutage] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RechargeFormValues>({
    resolver: zodResolver(rechargeFormSchema),
    mode: "onTouched",
    // Si ya hubo una recarga aprobada, se precargan los datos de la tarjeta guardada
    defaultValues: {
      cardholderName: wallet.card?.cardholderName ?? "",
      cardNumber: wallet.card?.cardNumber ?? "",
      expirationDate: wallet.card?.expirationDate ?? "",
      cvv: wallet.card?.cvv ?? "",
      amount: "",
    },
  });

  const fillTestCard = () => {
    const options = { shouldValidate: true };
    setValue("cardNumber", "1234123412341234", options);
    setValue("expirationDate", "12/26", options);
    setValue("cvv", "543", options);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    try {
      const result = await recharge(
        {
          cardholderName: values.cardholderName,
          cardNumber: values.cardNumber,
          expirationDate: values.expirationDate,
          cvv: values.cvv,
          amount: Number(values.amount),
        },
        { simulateOutage },
      );

      if (result.outcome.kind === "approved") {
        setApproved(result);
        toast.success("Recarga aprobada");
      } else {
        setFailure(describeFailure(result.outcome));
      }
    } catch (error) {
      setFailure({
        title: "No se pudo completar la recarga",
        message:
          error instanceof WalletError
            ? `${error.message}. Tu saldo no cambió.`
            : "Ocurrió un error inesperado. Tu saldo no cambió.",
      });
    }
  });

  if (approved) return <ApprovalPanel result={approved} onClose={onClose} />;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField
        id="cardholderName"
        label="Nombre en la tarjeta"
        autoComplete="cc-name"
        error={errors.cardholderName?.message}
        {...register("cardholderName")}
      />
      <FormField
        id="cardNumber"
        label="Número de tarjeta"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="1234 1234 1234 1234"
        error={errors.cardNumber?.message}
        {...register("cardNumber")}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="expirationDate"
          label="Vencimiento (MM/AA)"
          autoComplete="cc-exp"
          placeholder="12/26"
          error={errors.expirationDate?.message}
          {...register("expirationDate")}
        />
        <FormField
          id="cvv"
          label="CVV"
          type="password"
          inputMode="numeric"
          autoComplete="cc-csc"
          error={errors.cvv?.message}
          {...register("cvv")}
        />
      </div>

      <FormField
        id="amount"
        label="Monto a recargar"
        inputMode="decimal"
        placeholder="250.00"
        error={errors.amount?.message}
        {...register("amount")}
      />

      <div className="flex flex-col gap-3 text-sm">
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start p-0 text-primary"
          onClick={fillTestCard}
        >
          Autocompletar tarjeta de prueba
        </Button>
        <label className="flex items-start gap-2 text-muted-foreground">
          <input
            type="checkbox"
            className="mt-0.5 accent-primary"
            checked={simulateOutage}
            onChange={(event) => setSimulateOutage(event.target.checked)}
          />
          <span>Simular caída de SnailPay (solo demostración)</span>
        </label>
      </div>

      {failure && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <p className="font-medium text-destructive">{failure.title}</p>
          <p className="mt-1 text-foreground/90">{failure.message}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Procesando…" : "Recargar"}
      </Button>
    </form>
  );
}