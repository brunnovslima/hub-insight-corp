import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Scale, TrendingDown, AlertCircle, Shield } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/status-pill";
import { formatBRL, formatMonth, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/financeiro/liquidez")({
  head: () => ({ meta: [{ title: "Liquidez e Endividamento" }] }),
  component: Page,
});

function healthLiquidez(v: number): "ok" | "warn" | "crit" {
  if (v >= 1.5) return "ok";
  if (v >= 1.0) return "warn";
  return "crit";
}
function healthEndiv(v: number): "ok" | "warn" | "crit" {
  if (v <= 45) return "ok";
  if (v <= 60) return "warn";
  return "crit";
}

function Page() {
  const { data } = useQuery({
    queryKey: ["liquidez-page"],
    queryFn: async () => {
      const r = await supabase.from("indicadores_financeiros").select("*").order("periodo");
      return r.data ?? [];
    },
  });

  const last = data?.[data.length - 1];
  const chartData = (data ?? []).map((d) => ({
    mes: formatMonth(d.periodo as string),
    "Liquidez Corrente": Number(d.liquidez_corrente),
    "Liquidez Seca": Number(d.liquidez_seca),
    "Liquidez Imediata": Number(d.liquidez_imediata),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Liquidez e Endividamento" description="Capacidade de pagamento e estrutura de dívida" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Liquidez Corrente" value={Number(last?.liquidez_corrente ?? 0).toFixed(2)} hint="benchmark ≥ 1,5" icon={<Scale className="h-4 w-4" />} tone="primary" />
        <KpiCard title="Liquidez Seca" value={Number(last?.liquidez_seca ?? 0).toFixed(2)} hint="ex. estoques" icon={<Shield className="h-4 w-4" />} />
        <KpiCard title="Liquidez Imediata" value={Number(last?.liquidez_imediata ?? 0).toFixed(2)} hint="disponibilidades / PC" icon={<TrendingDown className="h-4 w-4" />} />
        <KpiCard title="Cobertura de Juros" value={Number(last?.cobertura_juros ?? 0).toFixed(1) + "x"} hint="EBIT / desp. financ." icon={<AlertCircle className="h-4 w-4" />} tone="gold" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Dívida Bruta</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBRL(Number(last?.divida_bruta ?? 0), { compact: true })}</p>
            <p className="text-xs text-muted-foreground mt-1">total de obrigações financeiras</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Dívida Líquida</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBRL(Number(last?.divida_liquida ?? 0), { compact: true })}</p>
            <p className="text-xs text-muted-foreground mt-1">bruta - caixa e equivalentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Endividamento Geral</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPercent(Number(last?.indice_endividamento_geral ?? 0))}</p>
            <p className="text-xs text-muted-foreground mt-1">passivo / ativo total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semáforo de Saúde Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between p-3 rounded-md border border-border">
              <span className="text-sm">Liquidez Corrente</span>
              <StatusPill status={healthLiquidez(Number(last?.liquidez_corrente ?? 0))}>{Number(last?.liquidez_corrente ?? 0).toFixed(2)}</StatusPill>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border border-border">
              <span className="text-sm">Liquidez Seca</span>
              <StatusPill status={healthLiquidez(Number(last?.liquidez_seca ?? 0))}>{Number(last?.liquidez_seca ?? 0).toFixed(2)}</StatusPill>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border border-border">
              <span className="text-sm">Endividamento</span>
              <StatusPill status={healthEndiv(Number(last?.indice_endividamento_geral ?? 0))}>{formatPercent(Number(last?.indice_endividamento_geral ?? 0))}</StatusPill>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border border-border">
              <span className="text-sm">Cobertura Juros</span>
              <StatusPill status={Number(last?.cobertura_juros ?? 0) >= 3 ? "ok" : Number(last?.cobertura_juros ?? 0) >= 1.5 ? "warn" : "crit"}>{Number(last?.cobertura_juros ?? 0).toFixed(1)}x</StatusPill>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Evolução Trimestral dos Índices de Liquidez</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Legend />
                <Line type="monotone" dataKey="Liquidez Corrente" stroke="var(--chart-1)" strokeWidth={2} />
                <Line type="monotone" dataKey="Liquidez Seca" stroke="var(--chart-2)" strokeWidth={2} />
                <Line type="monotone" dataKey="Liquidez Imediata" stroke="var(--chart-3)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}