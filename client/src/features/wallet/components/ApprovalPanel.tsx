import { Button } from "@/components/ui/button";
import { formatCents } from "@/shared/money";
import { toCents, type RechargeResult } from "../walletService";

interface ApprovalPanelProps {
  result: RechargeResult;
  onClose: () => void;
}

export function ApprovalPanel({ result, onClose }: ApprovalPanelProps) {
  const { outcome, wallet } = result;
  if (outcome.kind !== "approved") return null;
  const { response } = outcome;

  const rows: [string, string][] = [
    [
      "Monto acreditado",
      formatCents(toCents(response.transaction_amount ?? 0)),
    ],
    ["Referencia", response.reference],
    ["Código de autorización", response.authorization_code ?? "—"],
    ["Fecha", new Date(response.date_created).toLocaleString("es-MX")],
    ["Nuevo saldo", formatCents(wallet.balanceCents)],
  ];

  return (
    <div className="space-y-4" role="status">
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-center">
        <div className="text-3xl" aria-hidden="true">
          ✅
        </div>
        <p className="mt-1 text-lg font-semibold text-emerald-400">
          Operación aprobada
        </p>
        <p className="text-sm text-emerald-300/80">
          Tu saldo ya está actualizado.
        </p>
      </div>
      <dl className="divide-y divide-border text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      <Button className="w-full" onClick={onClose}>
        Listo
      </Button>
    </div>
  );
}