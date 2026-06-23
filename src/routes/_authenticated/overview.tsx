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
import { GlobalFilters } from "@/components/global-filters";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_authenticated/overview")({
  head: () => ({ meta: [{ title: "Visão Geral — Hub Corporativo" }] }),
  component: Overview,
});

function Overview() {
  const [filters, setFilters] = useGlobalFilters();
  const { data, isLoading } = useQuery({
    queryKey: ["overview", filters],
    queryFn: async () => {
      const [emp, vgv, fin, obras] = await Promise.all([
        supabase.from("empreendimentos").select("status"),
        (filters.empreendimentoId === "all"
          ? supabase.from("vgv_vendas").select("vgv_lancado, vgv_vendido, periodo").order("periodo")
          : supabase.from("vgv_vendas").select("vgv_lancado, vgv_vendido, periodo").eq("empreendimento_id", filters.empreendimentoId).order("periodo")),
        supabase.from("indicadores_financeiros").select("saldo_caixa, liquidez_corrente, margem_liquida_percentual, periodo").order("periodo", { ascending: false }).limit(6),
        supabase.from("andamento_obras").select("status"),
      ]);
      return { emp: emp.data ?? [], vgv: vgv.data ?? [], fin: fin.data ?? [], obras: obras.data ?? [] };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Visão Geral" description="Indicadores consolidados de mercado e financeiro" actions={<GlobalFilters value={filters} onChange={setFilters} />} />
        <DashboardSkeleton />
      </div>
    );
  }

  const ativos = data.emp.filter((e) => e.status === "Em Obra" || e.status === "Lançado").length;
  const vgvLancado = data.vgv.reduce((s, v) => s + Number(v.vgv_lancado || 0), 0);
  const vgvVendido = data.vgv.reduce((s, v) => s + Number(v.vgv_vendido || 0), 0);
  const obrasNoPrazo = data.obras.filter((o) => o.status === "No Prazo" || o.status === "Adiantado").length;
  const sparkVendido = data.vgv.map((v) => Number(v.vgv_vendido || 0));
  const finLatest = data.fin[0];
  const sparkCaixa = [...data.fin].reverse().map((f) => Number(f.saldo_caixa || 0));
  const sparkMargem = [...data.fin].reverse().map((f) => Number(f.margem_liquida_percentual || 0));
  const hasAny = data.emp.length + data.vgv.length + data.fin.length + data.obras.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão Geral"
        description="Indicadores consolidados de mercado e financeiro"
        actions={<GlobalFilters value={filters} onChange={setFilters} />}
      />

      {!hasAny && (
        <EmptyState
          title="Sem indicadores ainda"
          description="Cadastre empreendimentos e lance os primeiros dados de VGV, vendas e obras para ver o painel preenchido."
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Empreendimentos Ativos"
          value={ativos}
          hint={`${data.emp.length} no total`}
          icon={<Building2 className="h-4 w-4" />}
          tone="primary"
          description="Quantidade de empreendimentos atualmente em obra ou em lançamento ativo."
        />
        <KpiCard
          title="VGV Lançado"
          value={formatBRL(vgvLancado, { compact: true })}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="gold"
          description="Soma do Valor Geral de Vendas de todos os empreendimentos lançados no recorte selecionado."
        />
        <KpiCard
          title="VGV Vendido"
          value={formatBRL(vgvVendido, { compact: true })}
          hint={formatPercent((vgvVendido / Math.max(vgvLancado, 1)) * 100) + " do lançado"}
          icon={<DollarSign className="h-4 w-4" />}
          sparkline={sparkVendido}
          description="Total vendido acumulado em valor, comparado ao VGV total lançado."
        />
        <KpiCard
          title="Saldo de Caixa"
          value={formatBRL(Number(finLatest?.saldo_caixa || 0), { compact: true })}
          hint="Últimos períodos"
          icon={<Wallet className="h-4 w-4" />}
          sparkline={sparkCaixa}
          description="Saldo de caixa consolidado mais recente, com tendência dos últimos períodos."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><HardHat className="h-4 w-4 text-gold" /> Saúde das Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{obrasNoPrazo}/{data.obras.length}</div>
            <p className="text-sm text-muted-foreground mt-1">obras no prazo ou adiantadas</p>
            <div className="mt-3"><StatusPill status={obrasNoPrazo === data.obras.length ? "ok" : "warn"}>{obrasNoPrazo === data.obras.length ? "Todas em dia" : "Atenção em alguma obra"}</StatusPill></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Liquidez Corrente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Number(finLatest?.liquidez_corrente || 0).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">benchmark ≥ 1,5</p>
            <div className="mt-3"><StatusPill status={Number(finLatest?.liquidez_corrente || 0) >= 1.5 ? "ok" : "warn"}>{Number(finLatest?.liquidez_corrente || 0) >= 1.5 ? "Saudável" : "Atenção"}</StatusPill></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Margem Líquida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPercent(Number(finLatest?.margem_liquida_percentual || 0))}</div>
            <p className="text-sm text-muted-foreground mt-1">último trimestre</p>
            <div className="mt-3">
              <KpiCard
                title="Tendência"
                value=""
                sparkline={sparkMargem}
                className="border-0 shadow-none p-0 [&_h3]:hidden"
              />
            </div>
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