import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data: roles } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (!roles?.some((r: { role: string }) => r.role === "admin")) {
    throw new Error("Acesso negado: necessário perfil admin");
  }
}

type EmpresaInput = {
  nome: string;
  slug: string;
  logo_url?: string | null;
  settings?: Record<string, unknown>;
};

export const listEmpresas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("empresas")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const createEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const input = data as unknown as EmpresaInput;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: empresa, error } = await supabaseAdmin
      .from("empresas")
      .insert({ nome: input.nome, slug: input.slug, logo_url: input.logo_url || null, settings: input.settings || {} })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return empresa;
  });

export const updateEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { id, ...fields } = data as unknown as { id: string } & Partial<EmpresaInput>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: empresa, error } = await supabaseAdmin
      .from("empresas")
      .update(fields)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return empresa;
  });

export const toggleEmpresaActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { id, active } = data as unknown as { id: string; active: boolean };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: empresa, error } = await supabaseAdmin
      .from("empresas")
      .update({ active })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return empresa;
  });
