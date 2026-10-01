import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RechargeForm } from "./RechargeForm";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RechargeDialog({ open, onOpenChange }: RechargeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recargar saldo</DialogTitle>
          <DialogDescription>Pago simulado con SnailPay. Usa solo datos ficticios.</DialogDescription>
        </DialogHeader>
        <RechargeForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}