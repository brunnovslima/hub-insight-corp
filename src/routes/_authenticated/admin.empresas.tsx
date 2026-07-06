import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Building2, Plus, Power, PowerOff, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { listEmpresas, createEmpresa, updateEmpresa, toggleEmpresaActive } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/empresas")({
  head: () => ({ meta: [{ title: "Empresas - Admin" }] }),
  component: Page,
});

function Page() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Empresas" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gold" /> Acesso restrito
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <AdminPage />;
}

function AdminPage() {
  const qc = useQueryClient();
  const list = useServerFn(listEmpresas);
  const create = useServerFn(createEmpresa);
  const update = useServerFn(updateEmpresa);
  const toggle = useServerFn(toggleEmpresaActive);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formNome, setFormNome] = useState("");
  const [formSlug, setFormSlug] = useState("");

  const { data: empresas, isLoading } = useQuery({
    queryKey: ["admin-empresas"],
    queryFn: () => list({ data: undefined }),
  });

  const openCreate = () => {
    setEditing(null);
    setFormNome("");
    setFormSlug("");
    setDialogOpen(true);
  };

  const openEdit = (emp: any) => {
    setEditing(emp);
    setFormNome(emp.nome);
    setFormSlug(emp.slug);
    setDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNomeChange = (val: string) => {
    setFormNome(val);
    if (!editing) {
      setFormSlug(generateSlug(val));
    }
  };

  const handleSave = async () => {
    if (!formNome.trim() || !formSlug.trim()) {
      toast.error("Preencha nome e slug");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await update({ data: { id: editing.id, nome: formNome.trim(), slug: formSlug.trim() } });
        toast.success("Empresa atualizada");
      } else {
        await create({ data: { nome: formNome.trim(), slug: formSlug.trim() } });
        toast.success("Empresa criada");
      }
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-empresas"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (emp: any) => {
    try {
      await toggle({ data: { id: emp.id, active: !emp.active } });
      qc.invalidateQueries({ queryKey: ["admin-empresas"] });
      toast.success(emp.active ? "Empresa desativada" : "Empresa ativada");
    } catch (err) {
      toast.error("Erro ao alterar status");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Gerenciamento de clientes (tenants)"
        actions={
          <Button onClick={openCreate} className="bg-gold hover:bg-gold/90 text-gold-foreground">
            <Plus className="h-4 w-4 mr-2" /> Nova Empresa
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Carregando...</TableCell>
                </TableRow>
              )}
              {!isLoading && (empresas ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma empresa cadastrada</TableCell>
                </TableRow>
              )}
              {(empresas ?? []).map((emp: any) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-gold/15 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-gold" />
                      </div>
                      <span className="font-medium">{emp.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{emp.slug}</code></TableCell>
                  <TableCell>
                    <Badge variant={emp.active ? "default" : "secondary"} className={emp.active ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20" : ""}>
                      {emp.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(emp.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleToggle(emp)} title={emp.active ? "Desativar" : "Ativar"}>
                        {emp.active ? <PowerOff className="h-4 w-4 text-muted-foreground" /> : <Power className="h-4 w-4 text-emerald-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} title="Editar">
                        <Building2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da empresa</Label>
              <Input id="nome" value={formNome} onChange={(e) => handleNomeChange(e.target.value)} placeholder="Ex: Construtora Exemplo Ltda" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (identificador único)</Label>
              <Input id="slug" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="Ex: construtora-exemplo" />
              <p className="text-xs text-muted-foreground">Usado como identificador do tenant. Não pode conter espaços ou caracteres especiais.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gold hover:bg-gold/90 text-gold-foreground">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
