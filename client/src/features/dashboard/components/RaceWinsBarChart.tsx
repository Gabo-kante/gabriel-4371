import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RACES, getWinsBySnail } from "../simulatedData";

const data = getWinsBySnail();

export function RaceWinsBarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Victorias por caracol</CardTitle>
        <CardDescription>{RACES.length} carreras en el día simulado, un ganador por carrera</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64" role="img" aria-label="Gráfica de barras con las victorias de cada caracol">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                stroke="var(--border)" />
              <YAxis allowDecimals={false} domain={[0, "dataMax + 1"]}
                tick={{ fill: "var(--muted-foreground)" }} stroke="var(--border)" />
              <Tooltip
                cursor={{ fill: "rgba(233, 180, 76, 0.1)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "var(--foreground)" }}
                itemStyle={{ color: "var(--foreground)" }}
              />
              <Bar dataKey="wins" name="Victorias" fill="#e9b44c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}