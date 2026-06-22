import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HardHat, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusPill } from "@/components/status-pill";
import { formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/mercado/obras")({
  head: () => ({ meta: [{ title: "Obras e Entregas" }] }),
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["obras-page"],
    queryFn: async () => {
      const [obras, emp] = await Promise.all([
        supabase.from("andamento_obras").select("*"),
        supabase.from("empreendimentos").select("*"),
      ]);
      return { obras: obras.data ?? [], emp: emp.data ?? [] };
    },
  });

  const noPrazo = data?.obras.filter((o) => o.status === "No Prazo" || o.status === "Adiantado").length ?? 0;
  const totalObras = data?.obras.length ?? 1;
  const pctNoPrazo = (noPrazo / totalObras) * 100;
  const atrasadas = data?.obras.filter((o) => o.status === "Atrasado").length ?? 0;
  const concluidas = data?.emp.filter((e) => e.status === "Entregue").length ?? 0;

  const cards = (data?.emp ?? []).map((e) => {
    const o = data?.obras.find((x) => x.empreendimento_id === e.id);
    return { emp: e, obra: o };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Obras e Entregas" description="Acompanhamento físico, financeiro e cronograma" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="% Obras no Prazo" value={formatPercent(pctNoPrazo)} hint={`${noPrazo} de ${totalObras}`} icon={<CheckCircle2 className="h-4 w-4" />} tone="primary" />
        <KpiCard title="Obras Atrasadas" value={atrasadas} icon={<AlertCircle className="h-4 w-4" />} tone={atrasadas ? "gold" : "default"} />
        <KpiCard title="Em Andamento" value={(data?.emp.filter((e) => e.status === "Em Obra").length ?? 0)} icon={<HardHat className="h-4 w-4" />} />
        <KpiCard title="Concluídas" value={concluidas} icon={<Clock className="h-4 w-4" />} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ emp, obra }) => {
          const status = obra?.status ?? emp.status ?? "—";
          const statusKey = status === "Atrasado" ? "crit" : status === "Adiantado" || status === "No Prazo" ? "ok" : status === "Entregue" ? "neutral" : "warn";
          return (
            <Card key={emp.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{emp.nome}</CardTitle>
                  <StatusPill status={statusKey as "ok" | "warn" | "crit" | "neutral"}>{status}</StatusPill>
                </div>
                <p className="text-xs text-muted-foreground">{emp.cidade} · {emp.estado}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Evolução Física</span><span className="font-medium">{formatPercent(Number(obra?.evolucao_fisica_percentual ?? 0))}</span></div>
                  <Progress value={Number(obra?.evolucao_fisica_percentual ?? 0)} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Evolução Financeira</span><span className="font-medium">{formatPercent(Number(obra?.evolucao_financeira_percentual ?? 0))}</span></div>
                  <Progress value={Number(obra?.evolucao_financeira_percentual ?? 0)} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>Desvio cronograma</span>
                  <span className={obra?.desvio_cronograma_dias && obra.desvio_cronograma_dias > 0 ? "text-destructive font-medium" : "text-success font-medium"}>
                    {obra?.desvio_cronograma_dias ?? 0} dias
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}