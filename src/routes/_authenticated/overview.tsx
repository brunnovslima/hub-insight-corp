import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, DollarSign, TrendingUp, Wallet, HardHat, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatPercent } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/overview")({
  head: () => ({ meta: [{ title: "Visão Geral — Hub Corporativo" }] }),
  component: Overview,
});

function Overview() {
  const { data } = useQuery({
    queryKey: ["overview"],
    queryFn: async () => {
      const [emp, vgv, fin, obras] = await Promise.all([
        supabase.from("empreendimentos").select("status"),
        supabase.from("vgv_vendas").select("vgv_lancado, vgv_vendido"),
        supabase.from("indicadores_financeiros").select("saldo_caixa, liquidez_corrente, margem_liquida_percentual, periodo").order("periodo", { ascending: false }).limit(1),
        supabase.from("andamento_obras").select("status"),
      ]);
      return { emp: emp.data ?? [], vgv: vgv.data ?? [], fin: fin.data?.[0], obras: obras.data ?? [] };
    },
  });

  const ativos = data?.emp.filter((e) => e.status === "Em Obra" || e.status === "Lançado").length ?? 0;
  const vgvLancado = data?.vgv.reduce((s, v) => s + Number(v.vgv_lancado || 0), 0) ?? 0;
  const vgvVendido = data?.vgv.reduce((s, v) => s + Number(v.vgv_vendido || 0), 0) ?? 0;
  const obrasNoPrazo = data?.obras.filter((o) => o.status === "No Prazo" || o.status === "Adiantado").length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Visão Geral" description="Indicadores consolidados de mercado e financeiro" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Empreendimentos Ativos" value={ativos} hint={`${data?.emp.length ?? 0} no total`} icon={<Building2 className="h-4 w-4" />} tone="primary" />
        <KpiCard title="VGV Lançado" value={formatBRL(vgvLancado, { compact: true })} icon={<TrendingUp className="h-4 w-4" />} tone="gold" />
        <KpiCard title="VGV Vendido" value={formatBRL(vgvVendido, { compact: true })} hint={formatPercent((vgvVendido / Math.max(vgvLancado, 1)) * 100) + " do lançado"} icon={<DollarSign className="h-4 w-4" />} />
        <KpiCard title="Saldo de Caixa" value={formatBRL(Number(data?.fin?.saldo_caixa || 0), { compact: true })} hint="Trimestre atual" icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><HardHat className="h-4 w-4 text-gold" /> Saúde das Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{obrasNoPrazo}/{data?.obras.length ?? 0}</div>
            <p className="text-sm text-muted-foreground mt-1">obras no prazo ou adiantadas</p>
            <div className="mt-3"><StatusPill status={obrasNoPrazo === (data?.obras.length ?? 0) ? "ok" : "warn"}>{obrasNoPrazo === (data?.obras.length ?? 0) ? "Todas em dia" : "Atenção em alguma obra"}</StatusPill></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Liquidez Corrente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Number(data?.fin?.liquidez_corrente || 0).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">benchmark ≥ 1,5</p>
            <div className="mt-3"><StatusPill status={Number(data?.fin?.liquidez_corrente || 0) >= 1.5 ? "ok" : "warn"}>{Number(data?.fin?.liquidez_corrente || 0) >= 1.5 ? "Saudável" : "Atenção"}</StatusPill></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Margem Líquida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPercent(Number(data?.fin?.margem_liquida_percentual || 0))}</div>
            <p className="text-sm text-muted-foreground mt-1">último trimestre</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[var(--gradient-primary)] text-primary-foreground border-0">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-md bg-gold/20 flex items-center justify-center"><Bot className="h-5 w-5 text-gold" /></div>
            <div>
              <h3 className="font-semibold">Pergunte ao Assistente IA</h3>
              <p className="text-sm text-primary-foreground/70">Tire dúvidas sobre VGV, vendas, obras e financeiro em linguagem natural.</p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link to="/chat">Abrir Chat IA</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}