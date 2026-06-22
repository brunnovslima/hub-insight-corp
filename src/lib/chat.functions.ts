import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";

const SendInput = z.object({
  threadId: z.string().uuid(),
  content: z.string().min(1).max(4000),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SendInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify thread ownership
    const { data: thread, error: threadErr } = await supabase
      .from("chat_threads")
      .select("id, user_id, title")
      .eq("id", data.threadId)
      .single();
    if (threadErr || !thread || thread.user_id !== userId) {
      throw new Error("Thread não encontrada");
    }

    // Save user message
    const { error: insertErr } = await supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: userId,
      role: "user",
      content: data.content,
    });
    if (insertErr) throw new Error(insertErr.message);

    // Build data context (admin-style read via the same user RLS)
    const [emp, vgv, obras, ind, proj] = await Promise.all([
      supabase.from("empreendimentos").select("nome, cidade, estado, tipo, status, total_unidades, data_entrega_prevista"),
      supabase.from("vgv_vendas").select("empreendimento_id, mes_referencia, vgv_lancado, vgv_vendido, unidades_vendidas, unidades_distratadas, ticket_medio, vso_percentual").order("mes_referencia", { ascending: false }).limit(50),
      supabase.from("andamento_obras").select("empreendimento_id, mes_referencia, evolucao_fisica_percentual, evolucao_financeira_percentual, desvio_cronograma_dias, status").order("mes_referencia", { ascending: false }).limit(50),
      supabase.from("indicadores_financeiros").select("*").order("periodo", { ascending: false }).limit(8),
      supabase.from("fluxo_caixa_projecao").select("*").order("mes_referencia").limit(30),
    ]);

    const dbContext = JSON.stringify(
      {
        empreendimentos: emp.data,
        vgv_vendas_recentes: vgv.data,
        andamento_obras_recentes: obras.data,
        indicadores_financeiros: ind.data,
        fluxo_caixa_projecao: proj.data,
      },
      null,
      0,
    );

    // Load conversation history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true })
      .limit(40);

    const systemPrompt = `Você é o Assistente de Inteligência Corporativa da incorporadora — especialista em mercado imobiliário e finanças. Responda SEMPRE em português brasileiro, de forma objetiva e profissional.

REGRAS:
1. Use APENAS os dados fornecidos no contexto. Se uma informação não estiver disponível, diga "Não tenho esse dado no momento".
2. Formate valores monetários em R$ com separador de milhar (ex: R$ 1.250.000,00) ou compacto (R$ 1,25 mi).
3. Apresente comparações temporais quando relevante (mês anterior, trimestre, YTD).
4. Use tabelas em markdown quando houver múltiplos registros.
5. Destaque alertas: liquidez corrente < 1,5; obras atrasadas; margens em queda; distrato > 10%.
6. Seja conciso. Use bullets e cabeçalhos curtos.

DADOS DO BANCO (JSON):
${dbContext}`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    let assistantText = "";
    try {
      const result = await generateText({
        model,
        system: systemPrompt,
        messages: (history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      });
      assistantText = result.text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      if (msg.includes("429")) throw new Error("Muitas requisições. Tente novamente em alguns segundos.");
      if (msg.includes("402")) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error("Falha ao consultar o assistente: " + msg);
    }

    // Save assistant message + update thread title if first exchange
    await supabase.from("chat_messages").insert({
      thread_id: data.threadId,
      user_id: userId,
      role: "assistant",
      content: assistantText,
    });

    if (thread.title === "Nova conversa") {
      const title = data.content.slice(0, 60);
      await supabase.from("chat_threads").update({ title, updated_at: new Date().toISOString() }).eq("id", data.threadId);
    } else {
      await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", data.threadId);
    }

    return { content: assistantText };
  });