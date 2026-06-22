import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, RotateCcw, DollarSign } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL, formatMonth, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/mercado/estoque")({
  head: () => ({ meta: [{ title: "Estoque e Distratos" }] }),
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["estoque-page"],
    queryFn: async () => {
      const [vgv, emp] = await Promise.all([
        supabase.from("vgv_vendas").select("*").order("mes_referencia"),
        supabase.from("empreendimentos").select("*"),
      ]);
      return { vgv: vgv.data ?? [], emp: emp.data ?? [] };
    },
  });

  const totalEstoque = (data?.emp ?? []).reduce((s, e) => {
    const vendidas = data?.vgv.filter((v) => v.empreendimento_id === e.id).reduce((a, v) => a + (v.unidades_vendidas || 0), 0) ?? 0;
    return s + Math.max(0, (e.total_unidades ?? 0) - vendidas);
  }, 0);
  const totalDistratos = data?.vgv.reduce((s, v) => s + (v.unidades_distratadas || 0), 0) ?? 0;
  const totalContratos = data?.vgv.reduce((s, v) => s + (v.unidades_vendidas || 0), 0) ?? 0;
  const taxaDistrato = totalContratos ? (totalDistratos / totalContratos) * 100 : 0;
  const volumeDistratoRS = (data?.vgv ?? []).reduce((s, v) => s + (v.unidades_distratadas || 0) * Number(v.ticket_medio || 0), 0);

  const byMonth = new Map<string, { mes: string; distratos: number }>();
  data?.vgv.forEach((v) => {
    const k = v.mes_referencia as string;
    const prev = byMonth.get(k) ?? { mes: formatMonth(k), distratos: 0 };
    prev.distratos += v.unidades_distratadas || 0;
    byMonth.set(k, prev);
  });
  const chartData = Array.from(byMonth.values());

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque e Distratos" description="Inventário disponível e impacto de distratos" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Unidades em Estoque" value={totalEstoque} icon={<Package className="h-4 w-4" />} tone="primary" />
        <KpiCard title="Taxa de Distrato" value={formatPercent(taxaDistrato)} hint="distratos / contratos" icon={<AlertTriangle className="h-4 w-4" />} tone="gold" />
        <KpiCard title="Volume de Distratos" value={formatBRL(volumeDistratoRS, { compact: true })} hint="impacto financeiro" icon={<DollarSign className="h-4 w-4" />} />
        <KpiCard title="Unidades Retomadas" value={totalDistratos} hint="devolvidas ao estoque" icon={<RotateCcw className="h-4 w-4" />} />
      </div>
      <Card>
        <CardHeader><CardTitle>Evolução Mensal de Distratos</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Line type="monotone" dataKey="distratos" stroke="var(--destructive)" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Detalhe por Empreendimento</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empreendimento</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Distratos</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.emp ?? []).map((e) => {
                const v = data?.vgv.filter((x) => x.empreendimento_id === e.id) ?? [];
                const vendidas = v.reduce((s, x) => s + (x.unidades_vendidas || 0), 0);
                const distratos = v.reduce((s, x) => s + (x.unidades_distratadas || 0), 0);
                const taxa = vendidas ? (distratos / vendidas) * 100 : 0;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.nome}</TableCell>
                    <TableCell className="text-right">{Math.max(0, (e.total_unidades ?? 0) - vendidas)}</TableCell>
                    <TableCell className="text-right">{distratos}</TableCell>
                    <TableCell className="text-right">{formatPercent(taxa)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}