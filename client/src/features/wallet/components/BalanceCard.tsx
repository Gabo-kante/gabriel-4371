import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/shared/money";
import { useWallet } from "../useWallet";
import { RechargeDialog } from "./RechargeDialog";

export function BalanceCard() {
  const { wallet } = useWallet();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="max-w-sm">
        <CardHeader>
          <CardDescription>Saldo actual</CardDescription>
          <CardTitle className="text-3xl">{formatCents(wallet.balanceCents)}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setOpen(true)}>Recargar saldo</Button>
        </CardContent>
      </Card>
      <RechargeDialog open={open} onOpenChange={setOpen} />
    </>
  );
}