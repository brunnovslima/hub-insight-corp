import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LineChart as LineIcon, Percent, TrendingUp, BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMonth, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/financeiro/rentabilidade")({
  head: () => ({ meta: [{ title: "Rentabilidade" }] }),
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["rent-page"],
    queryFn: async () => {
      const [ind, emp] = await Promise.all([
        supabase.from("indicadores_financeiros").select("*").order("periodo"),
        supabase.from("empreendimentos").select("*"),
      ]);
      return { ind: ind.data ?? [], emp: emp.data ?? [] };
    },
  });

  const last = data?.ind[data.ind.length - 1];
  const chartData = (data?.ind ?? []).map((d) => ({
    mes: formatMonth(d.periodo as string),
    Bruta: Number(d.margem_bruta_percentual),
    EBITDA: Number(d.margem_ebitda_percentual),
    Líquida: Number(d.margem_liquida_percentual),
  }));

  // synthetic TIR/contribuicao por emp
  const ranking = (data?.emp ?? []).map((e, i) => ({
    nome: e.nome,
    tir: 18 + ((i * 7) % 12),
    contribuicao: 22 + ((i * 5) % 18),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Rentabilidade" description="Margens, retornos e contribuição por empreendimento" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Margem Bruta" value={formatPercent(Number(last?.margem_bruta_percentual ?? 0))} icon={<Percent className="h-4 w-4" />} tone="primary" />
        <KpiCard title="Margem EBITDA" value={formatPercent(Number(last?.margem_ebitda_percentual ?? 0))} icon={<BarChart3 className="h-4 w-4" />} tone="gold" />
        <KpiCard title="Margem Líquida" value={formatPercent(Number(last?.margem_liquida_percentual ?? 0))} icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard title="ROE" value={formatPercent(Number(last?.roe ?? 0))} hint={`ROA ${formatPercent(Number(last?.roa ?? 0))} · ROIC ${formatPercent(Number(last?.roic ?? 0))}`} icon={<LineIcon className="h-4 w-4" />} />
      </div>
      <Card>
        <CardHeader><CardTitle>Evolução das Margens por Trimestre</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Bar dataKey="Bruta" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="EBITDA" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Líquida" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Ranking de Rentabilidade por Empreendimento</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empreendimento</TableHead>
                <TableHead>TIR</TableHead>
                <TableHead>Margem de Contribuição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((r) => (
                <TableRow key={r.nome}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full bg-gold" style={{ width: `${(r.tir / 30) * 100}%` }} /></div>
                      <span className="text-sm font-medium">{formatPercent(r.tir)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(r.contribuicao / 40) * 100}%` }} /></div>
                      <span className="text-sm font-medium">{formatPercent(r.contribuicao)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}