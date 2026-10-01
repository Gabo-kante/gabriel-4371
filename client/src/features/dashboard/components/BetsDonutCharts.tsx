import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBetOutcomes } from "../simulatedData";

const outcomes = getBetOutcomes();

const data = [
  { name: "Ganadas", value: outcomes.won, color: "#059669" },
  { name: "Perdidas", value: outcomes.lost, color: "#e11d48" },
];

export function BetsDonutChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apuestas ganadas y perdidas</CardTitle>
        <CardDescription>
          {outcomes.total} apuestas en el día simulado: {outcomes.won} ganadas y {outcomes.lost} perdidas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64" role="img" aria-label={`Apuestas: ${outcomes.won} ganadas, ${outcomes.lost} perdidas`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}