import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Clock, Target, DollarSign } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/mercado/vendas")({
  head: () => ({ meta: [{ title: "Performance de Vendas" }] }),
  component: Page,
});

const FUNIL = [
  { etapa: "Leads", valor: 4800 },
  { etapa: "Visitas", valor: 1450 },
  { etapa: "Propostas", valor: 520 },
  { etapa: "Contratos", valor: 178 },
];

function Page() {
  const { data } = useQuery({
    queryKey: ["vendas-page"],
    queryFn: async () => {
      const [vgv, emp] = await Promise.all([
        supabase.from("vgv_vendas").select("*"),
        supabase.from("empreendimentos").select("*"),
      ]);
      return { vgv: vgv.data ?? [], emp: emp.data ?? [] };
    },
  });

  const porEmp = (data?.emp ?? []).map((e) => {
    const vendas = data?.vgv.filter((v) => v.empreendimento_id === e.id) ?? [];
    const vendidas = vendas.reduce((s, v) => s + (v.unidades_vendidas || 0), 0);
    const ticket = vendas.length ? vendas.reduce((s, v) => s + Number(v.ticket_medio || 0), 0) / vendas.length : 0;
    const vsoAvg = vendas.length ? vendas.reduce((s, v) => s + Number(v.vso_percentual || 0), 0) / vendas.length : 0;
    return {
      nome: e.nome,
      total: e.total_unidades ?? 0,
      vendidas,
      estoque: Math.max(0, (e.total_unidades ?? 0) - vendidas),
      ticket,
      vso: vsoAvg,
    };
  });

  const totalLancadas = porEmp.reduce((s, p) => s + p.total, 0);
  const totalVendidas = porEmp.reduce((s, p) => s + p.vendidas, 0);
  const ticketAvg = porEmp.length ? porEmp.reduce((s, p) => s + p.ticket, 0) / porEmp.length : 0;

  const ranking = [...porEmp].sort((a, b) => b.vendidas - a.vendidas);

  return (
    <div className="space-y-6">
      <PageHeader title="Performance de Vendas" description="Funil, ticket médio e ranking de empreendimentos" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Unidades Lançadas" value={totalLancadas} icon={<ShoppingCart className="h-4 w-4" />} tone="primary" />
        <KpiCard title="Unidades Vendidas" value={totalVendidas} hint={formatPercent((totalVendidas / Math.max(totalLancadas, 1)) * 100) + " do total"} icon={<DollarSign className="h-4 w-4" />} tone="gold" />
        <KpiCard title="Ticket Médio" value={formatBRL(ticketAvg, { compact: true })} icon={<Target className="h-4 w-4" />} />
        <KpiCard title="Tempo Médio de Venda" value="68 dias" hint="média dos lançamentos" icon={<Clock className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Funil de Vendas</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FUNIL} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="etapa" className="text-xs" width={80} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                    {FUNIL.map((_, i) => <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Taxa de conversão geral: {((178 / 4800) * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ranking de Vendas</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="nome" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                  <Bar dataKey="vendidas" name="Unidades Vendidas" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Detalhe por Empreendimento</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empreendimento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Vendidas</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">VSO Médio</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porEmp.map((p) => (
                <TableRow key={p.nome}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-right">{p.total}</TableCell>
                  <TableCell className="text-right">{p.vendidas}</TableCell>
                  <TableCell className="text-right">{p.estoque}</TableCell>
                  <TableCell className="text-right">{formatPercent(p.vso)}</TableCell>
                  <TableCell className="text-right">{formatBRL(p.ticket, { compact: true })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}