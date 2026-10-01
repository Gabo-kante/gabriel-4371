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
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} domain={[0, "dataMax + 1"]} />
              <Tooltip cursor={{ fill: "rgba(5, 150, 105, 0.08)" }} />
              <Bar dataKey="wins" name="Victorias" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}