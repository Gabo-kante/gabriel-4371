import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { BalanceCard } from "@/features/wallet/components/BalanceCard";
import { BetsDonutChart } from "../components/BetsDonutCharts";
import { RaceWinsBarChart } from "../components/RaceWinsBarChart";

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-emerald-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-semibold text-emerald-800">
            <span aria-hidden="true">🐌</span> Snail Racing
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.fullName}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-4">
          <h1 className="text-2xl font-bold">Hola, {user?.fullName}</h1>
          <BalanceCard />

          <section className="space-y-3" aria-labelledby="stats-title">
            <div>
              <h2 id="stats-title" className="text-lg font-semibold">Resumen del día</h2>
              <p className="text-sm text-muted-foreground">
                Datos simulados: no corresponden a apuestas reales de tu cuenta.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <BetsDonutChart />
              <RaceWinsBarChart />
            </div>
          </section>
        </main>
    </div>
  );
}