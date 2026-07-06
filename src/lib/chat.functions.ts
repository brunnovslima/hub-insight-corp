import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHash } from "node:crypto";
import { z } from "zod";

const SendInput = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(4000),
});

type HistoryMsg = { role: string; content: string };

/* ---------- Cloudflare Workers AI (REST API, sem binding) ---------- */
async function queryCloudflareAI(
  accountId: string,
  apiToken: string,
  system: string,
  history: HistoryMsg[],
): Promise<string> {
  const messages: { role: string; content: string }[] = [
    { role: "system", content: system },
    ...history.map(m => ({ role: m.role === "assistant" ? "assistant" : "user" as const, content: m.content })),
  ];

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages, max_tokens: 4096 }),
    },
  );

  if (res.status === 429) throw new Error("CF_QUOTA");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudflare AI retornou ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  if (!data.success) throw new Error(`Cloudflare AI: ${data.errors?.[0]?.message ?? "erro desconhecido"}`);

  const text = data.result?.response;
  if (!text) throw new Error("Resposta vazia da Cloudflare AI");
  return text;
}

/* ---------- Cloudflare Workers AI (único provedor) ---------- */
async function queryAI(
  system: string,
  history: HistoryMsg[],
): Promise<string> {
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!cfAccountId || !cfApiToken) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN não configurados");
  }

  return await queryCloudflareAI(cfAccountId, cfApiToken, system, history);
}

/* ---------- Sumariza dados do banco (poucos tokens) ---------- */
function summarizeEmpreendimentos(data: any[]) {
  if (!data?.length) return "Nenhum empreendimento cadastrado.";
  const total = data.length;
  const ativos = data.filter((e: any) => e.status === "ativo").length;
  const tipos = [...new Set(data.map((e: any) => e.tipo))];
  return `${total} empreendimentos (${ativos} ativos). Tipos: ${tipos.join(", ")}.`;
}

function summarizeVGV(data: any[]) {
  if (!data?.length) return "Nenhum dado de VGV.";
  const totalVendido = data.reduce((s: number, r: any) => s + (Number(r.vgv_vendido) || 0), 0);
  const ultimo = data[0];
  return `VGV total registrado: R$ ${(totalVendido / 1e6).toFixed(1)} mi. Último mês: ${ultimo.mes_referencia}, VGV vendido R$ ${(Number(ultimo.vgv_vendido) / 1e6).toFixed(1)} mi, VSO ${ultimo.vso_percentual}%.`;
}

function summarizeObras(data: any[]) {
  if (!data?.length) return "Nenhum dado de obras.";
  const atrasadas = data.filter((r: any) => Number(r.desvio_cronograma_dias) > 0);
  return `${data.length} registros de obra. ${atrasadas.length} com atraso (média ${atrasadas.length ? (atrasadas.reduce((s: number, r: any) => s + Number(r.desvio_cronograma_dias), 0) / atrasadas.length).toFixed(0) : 0} dias).`;
}

function summarizeIndicadores(data: any[]) {
  if (!data?.length) return "Nenhum indicador financeiro.";
  const latest = data[0];
  const alerts: string[] = [];
  if (Number(latest.liquidez_corrente) < 1.5) alerts.push("liquidez corrente abaixo de 1,5");
  if (Number(latest.margem_liquida) < 0) alerts.push("margem líquida negativa");
  return `Último período: ${latest.periodo}. LC ${latest.liquidez_corrente}, Margem ${latest.margem_liquida}%, ROE ${latest.roe}%.${alerts.length ? ` ⚠ Alertas: ${alerts.join("; ")}.` : ""}`;
}

function summarizeFluxo(data: any[]) {
  if (!data?.length) return "Nenhuma projeção de fluxo.";
  const saldo = data[data.length - 1]?.saldo_projetado ?? 0;
  return `${data.length} meses projetados. Saldo final projetado: R$ ${(Number(saldo) / 1e6).toFixed(1)} mi.`;
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SendInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: thread, error: threadErr } = await supabase
      .from("chat_threads")
      .select("id, user_id, title")
      .eq("id", data.threadId)
      .single();
    if (threadErr || !thread || thread.user_id !== userId) {
      throw new Error("Thread não encontrada");
    }

    const { error: insertErr } = await supabase.from("chat_messages").insert({
      thread_id: data.threadId, user_id: userId, role: "user", content: data.content,
    });
    if (insertErr) throw new Error(insertErr.message);

    const [emp, vgv, obras, ind, proj] = await Promise.all([
      supabase.from("empreendimentos").select("nome, tipo, status"),
      supabase.from("vgv_vendas").select("mes_referencia, vgv_vendido, vso_percentual").order("mes_referencia", { ascending: false }).limit(12),
      supabase.from("andamento_obras").select("desvio_cronograma_dias").limit(100),
      supabase.from("indicadores_financeiros").select("periodo, liquidez_corrente, margem_liquida, roe").order("periodo", { ascending: false }).limit(4),
      supabase.from("fluxo_caixa_projecao").select("saldo_projetado").order("mes_referencia", { ascending: false }).limit(1),
    ]);

    const ctx = [
      "EMPRENDIMENTOS:", summarizeEmpreendimentos(emp.data),
      "VGV VENDAS:", summarizeVGV(vgv.data),
      "OBRAS:", summarizeObras(obras.data),
      "INDICADORES:", summarizeIndicadores(ind.data),
      "FLUXO DE CAIXA:", summarizeFluxo(proj.data),
    ].join("\n");

    /* ---------- Cache: mesmo contexto + pergunta evita nova chamada ---------- */
    const cacheRaw = `${ctx}\n${data.content}`;
    const cacheKey = createHash("sha256").update(cacheRaw).digest("hex");

    const { data: cached } = await supabaseAdmin
      .from("response_cache")
      .select("response")
      .eq("cache_key", cacheKey)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      await supabase.from("chat_messages").insert({
        thread_id: data.threadId, user_id: userId, role: "assistant", content: cached.response,
      });
      if (thread.title === "Nova conversa") {
        await supabase.from("chat_threads").update({ title: data.content.slice(0, 60), updated_at: new Date().toISOString() }).eq("id", data.threadId);
      } else {
        await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", data.threadId);
      }
      return { content: cached.response };
    }

    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true })
      .limit(20);

    const systemPrompt = `Você é um analista corporativo especializado em mercado imobiliário. Responda em português, seja objetivo, use valores em R$. Destaque alertas (LC<1,5; obras atrasadas; margem negativa; distrato>10%). Use bullets.

CONTEXTO:
${ctx}`;

    const assistantText = await queryAI(systemPrompt, history ?? []);

    /* ---------- Armazena no cache ---------- */
    try {
      await supabaseAdmin.from("response_cache").insert({
        cache_key: cacheKey,
        response: assistantText,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
    } catch {
      // Cache insert failure is non-fatal
    }

    await supabase.from("chat_messages").insert({
      thread_id: data.threadId, user_id: userId, role: "assistant", content: assistantText,
    });

    if (thread.title === "Nova conversa") {
      await supabase.from("chat_threads").update({ title: data.content.slice(0, 60), updated_at: new Date().toISOString() }).eq("id", data.threadId);
    } else {
      await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", data.threadId);
    }

    return { content: assistantText };
  });