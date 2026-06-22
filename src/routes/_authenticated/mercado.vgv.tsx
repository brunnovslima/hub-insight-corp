import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Package, Building2, Gauge, MapPin } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatMonth, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/mercado/vgv")({
  head: () => ({ meta: [{ title: "VGV e Lançamentos" }] }),
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["vgv-page"],
    queryFn: async () => {
      const [vgv, emp] = await Promise.all([
        supabase.from("vgv_vendas").select("*").order("mes_referencia"),
        supabase.from("empreendimentos").select("*"),
      ]);
      return { vgv: vgv.data ?? [], emp: emp.data ?? [] };
    },
  });

  const totalLancado = data?.vgv.reduce((s, v) => s + Number(v.vgv_lancado || 0), 0) ?? 0;
  const totalVendido = data?.vgv.reduce((s, v) => s + Number(v.vgv_vendido || 0), 0) ?? 0;
  const estoque = totalLancado - totalVendido;
  const ativos = data?.emp.filter((e) => e.status === "Em Obra" || e.status === "Lançado").length ?? 0;
  const entregues = data?.emp.filter((e) => e.status === "Entregue").length ?? 0;
  const avgVSO = data?.vgv.length ? data.vgv.reduce((s, v) => s + Number(v.vso_percentual || 0), 0) / data.vgv.length : 0;

  // Monthly aggregation
  const byMonth = new Map<string, { mes: string; lancado: number; vendido: number; vso: number; count: number }>();
  data?.vgv.forEach((v) => {
    const key = v.mes_referencia as string;
    const prev = byMonth.get(key) ?? { mes: formatMonth(key), lancado: 0, vendido: 0, vso: 0, count: 0 };
    prev.lancado += Number(v.vgv_lancado || 0) / 12; // approximate monthly slice
    prev.vendido += Number(v.vgv_vendido || 0);
    prev.vso += Number(v.vso_percentual || 0);
    prev.count += 1;
    byMonth.set(key, prev);
  });
  const chartData = Array.from(byMonth.values()).map((d) => ({ ...d, vso: d.vso / d.count }));

  return (
    <div className="space-y-6">
      <PageHeader title="VGV e Lançamentos" description="Valor Geral de Vendas, lançamentos e velocidade de vendas" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="VGV Total Lançado" value={formatBRL(totalLancado, { compact: true })} icon={<TrendingUp className="h-4 w-4" />} tone="primary" />
        <KpiCard title="VGV Vendido" value={formatBRL(totalVendido, { compact: true })} hint={formatPercent((totalVendido / Math.max(totalLancado, 1)) * 100) + " do VGV"} icon={<DollarSign className="h-4 w-4" />} tone="gold" />
        <KpiCard title="VGV em Estoque" value={formatBRL(estoque, { compact: true })} hint={formatPercent((estoque / Math.max(totalLancado, 1)) * 100) + " restante"} icon={<Package className="h-4 w-4" />} />
        <KpiCard title="Empreendimentos Ativos" value={ativos} hint={`${entregues} entregues`} icon={<Building2 className="h-4 w-4" />} />
        <KpiCard title="VSO Médio (12m)" value={formatPercent(avgVSO)} hint="velocidade de vendas mensal" icon={<Gauge className="h-4 w-4" />} />
        <KpiCard title="Total Unidades" value={data?.emp.reduce((s, e) => s + (e.total_unidades ?? 0), 0) ?? 0} hint="em todos os empreendimentos" icon={<Building2 className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader><CardTitle>VGV Lançado vs Vendido (mensal)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => formatBRL(v, { compact: true })} />
                <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Bar dataKey="lancado" name="VGV Lançado (proporcional)" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vendido" name="VGV Vendido" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Evolução do VSO Mensal</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                  <Line type="monotone" dataKey="vso" stroke="var(--gold)" strokeWidth={2.5} dot={{ fill: "var(--gold)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />Empreendimentos por Região</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.emp.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{e.nome}</p>
                    <p className="text-xs text-muted-foreground">{e.cidade} · {e.estado}</p>
                  </div>
                  <span className="text-xs text-gold uppercase tracking-wider">{e.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}