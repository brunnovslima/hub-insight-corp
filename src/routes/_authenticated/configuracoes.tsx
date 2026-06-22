import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações" }] }),
  component: Page,
});

function Page() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");

  const { data: profiles } = useQuery({
    queryKey: ["profiles-all"],
    enabled: isAdmin,
    queryFn: async () => {
      const r = await supabase.from("profiles").select("*");
      return r.data ?? [];
    },
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configurações" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-gold" /> Acesso restrito</CardTitle>
            <CardDescription>Esta página é exclusiva para usuários com perfil de administrador.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Administração de usuários e perfis" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> Perfis disponíveis</CardTitle>
          <CardDescription>Controle de acesso por papel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { role: "admin", desc: "Acesso total ao sistema" },
              { role: "diretor", desc: "Todos os dashboards + Chat IA" },
              { role: "analista", desc: "Leitura de dashboards + Chat IA" },
              { role: "gestor_obra", desc: "Apenas Indicadores de Mercado" },
            ].map((r) => (
              <div key={r.role} className="p-3 rounded-md border border-border">
                <p className="font-mono text-xs text-gold uppercase">{r.role}</p>
                <p className="text-sm mt-1">{r.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Usuários ({profiles?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Criado em</TableHead></TableRow></TableHeader>
            <TableBody>
              {(profiles ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}