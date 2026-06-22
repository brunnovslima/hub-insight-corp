import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL, formatMonth, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/financeiro/balanco")({
  head: () => ({ meta: [{ title: "Balanço Patrimonial" }] }),
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["balanco-page"],
    queryFn: async () => {
      const r = await supabase.from("indicadores_financeiros").select("*").order("periodo");
      return r.data ?? [];
    },
  });

  const last = data?.[data.length - 1];
  const prev = data?.[data.length - 2];
  const delta = (a?: number | null, b?: number | null) => (a && b ? ((Number(a) - Number(b)) / Number(b)) * 100 : 0);

  const ativo = [
    { name: "Circulante", value: Number(last?.ativo_circulante ?? 0) },
    { name: "Não Circulante", value: Number(last?.ativo_nao_circulante ?? 0) },
  ];
  const passivo = [
    { name: "Passivo Circulante", value: Number(last?.passivo_circulante ?? 0) },
    { name: "Passivo Não Circ.", value: Number(last?.passivo_nao_circulante ?? 0) },
    { name: "Patrimônio Líquido", value: Number(last?.patrimonio_liquido ?? 0) },
  ];
  const colors = ["var(--chart-1)", "var(--gold)", "var(--chart-3)"];

  const evolPL = (data ?? []).map((d) => ({ mes: formatMonth(d.periodo as string), PL: Number(d.patrimonio_liquido) }));

  return (
    <div className="space-y-6">
      <PageHeader title="Balanço Patrimonial Resumido" description="Estrutura de ativo, passivo e patrimônio líquido" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Ativo Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatBRL(Number(last?.ativo_total ?? 0), { compact: true })}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Passivo Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatBRL(Number(last?.passivo_total ?? 0), { compact: true })}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Patrimônio Líquido</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-gold">{formatBRL(Number(last?.patrimonio_liquido ?? 0), { compact: true })}</p></CardContent></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Composição do Ativo</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ativo} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label>
                    {ativo.map((_, i) => (<Cell key={i} fill={colors[i]} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Composição do Passivo + PL</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={passivo} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label>
                    {passivo.map((_, i) => (<Cell key={i} fill={colors[i]} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Evolução do Patrimônio Líquido</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolPL}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => formatBRL(v, { compact: true })} />
                <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                <Line type="monotone" dataKey="PL" stroke="var(--gold)" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Resumo com Variação vs Período Anterior</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Conta</TableHead><TableHead className="text-right">Atual</TableHead><TableHead className="text-right">Anterior</TableHead><TableHead className="text-right">Δ%</TableHead></TableRow></TableHeader>
            <TableBody>
              {[
                { label: "Ativo Total", a: last?.ativo_total, b: prev?.ativo_total },
                { label: "Passivo Total", a: last?.passivo_total, b: prev?.passivo_total },
                { label: "Patrimônio Líquido", a: last?.patrimonio_liquido, b: prev?.patrimonio_liquido },
                { label: "Dívida Líquida", a: last?.divida_liquida, b: prev?.divida_liquida },
              ].map((r) => {
                const d = delta(r.a as number, r.b as number);
                return (
                  <TableRow key={r.label}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right">{formatBRL(Number(r.a ?? 0), { compact: true })}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatBRL(Number(r.b ?? 0), { compact: true })}</TableCell>
                    <TableCell className={`text-right font-medium ${d > 0 ? "text-success" : d < 0 ? "text-destructive" : ""}`}>{d > 0 ? "+" : ""}{formatPercent(d)}</TableCell>
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