import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ArrowDown, ArrowUp, Flame, Timer } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatMonth } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/financeiro/fluxo")({
  head: () => ({ meta: [{ title: "Fluxo de Caixa" }] }),
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["fluxo-page"],
    queryFn: async () => {
      const [ind, proj] = await Promise.all([
        supabase.from("indicadores_financeiros").select("*").order("periodo"),
        supabase.from("fluxo_caixa_projecao").select("*").order("mes_referencia"),
      ]);
      return { ind: ind.data ?? [], proj: proj.data ?? [] };
    },
  });

  const last = data?.ind[data.ind.length - 1];
  const burn = Number(last?.burn_rate ?? 0);
  const caixa = Number(last?.saldo_caixa ?? 0);
  const runway = burn ? Math.round((caixa / burn) * 10) / 10 : 0;

  const waterfall = [
    { etapa: "Entradas", valor: Number(last?.entradas_periodo ?? 0) },
    { etapa: "Saídas", valor: -Number(last?.saidas_periodo ?? 0) },
    { etapa: "Saldo final", valor: caixa },
  ];

  const cenarios = new Map<string, { mes: string; otimista?: number; realista?: number; pessimista?: number }>();
  data?.proj.forEach((p) => {
    const k = p.mes_referencia as string;
    const cur = cenarios.get(k) ?? { mes: formatMonth(k) };
    (cur as Record<string, unknown>)[p.cenario as string] = Number(p.saldo_projetado);
    cenarios.set(k, cur);
  });
  const projData = Array.from(cenarios.values());

  return (
    <div className="space-y-6">
      <PageHeader title="Fluxo de Caixa" description="Entradas, saídas, queima e projeção" />
      <Card className="bg-[var(--gradient-primary)] text-primary-foreground border-0">
        <CardContent className="p-6">
          <p className="text-sm text-primary-foreground/70 uppercase tracking-wider">Saldo de Caixa Atual</p>
          <p className="text-4xl font-bold mt-1">{formatBRL(caixa)}</p>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Entradas no Período" value={formatBRL(Number(last?.entradas_periodo ?? 0), { compact: true })} icon={<ArrowDown className="h-4 w-4" />} />
        <KpiCard title="Saídas no Período" value={formatBRL(Number(last?.saidas_periodo ?? 0), { compact: true })} icon={<ArrowUp className="h-4 w-4" />} />
        <KpiCard title="Burn Rate (mensal)" value={formatBRL(burn, { compact: true })} icon={<Flame className="h-4 w-4" />} tone="gold" />
        <KpiCard title="Runway" value={`${runway} meses`} hint="caixa atual / burn" icon={<Timer className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cascata Entradas vs Saídas</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfall}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="etapa" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => formatBRL(v, { compact: true })} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {waterfall.map((d, i) => (<Wallet key={i} fill={d.valor >= 0 ? "var(--success)" : "var(--destructive)"} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Projeção 6 meses (3 cenários)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => formatBRL(v, { compact: true })} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                  <Legend />
                  <Area type="monotone" dataKey="otimista" stroke="var(--success)" fill="var(--success)" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="realista" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.25} />
                  <Area type="monotone" dataKey="pessimista" stroke="var(--destructive)" fill="var(--destructive)" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}