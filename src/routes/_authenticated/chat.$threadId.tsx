import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sendChatMessage } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThread,
});

const QUICK_PROMPTS = [
  "Qual o VGV vendido este mês?",
  "Quais obras estão atrasadas?",
  "Como está nosso fluxo de caixa?",
  "Qual empreendimento tem maior distrato?",
  "Qual a margem líquida do último trimestre?",
];

function ChatThread() {
  const { threadId } = Route.useParams();
  const qc = useQueryClient();
  const send = useServerFn(sendChatMessage);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["chat-messages", threadId],
    queryFn: async () => {
      const r = await supabase.from("chat_messages").select("*").eq("thread_id", threadId).order("created_at");
      return r.data ?? [];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    textareaRef.current?.focus();
  }, [messages, sending]);

  const submit = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    try {
      await send({ data: { threadId, content } });
      qc.invalidateQueries({ queryKey: ["chat-messages", threadId] });
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar mensagem");
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isEmpty = !messages || messages.length === 0;

  return (
    <div className="h-full flex flex-col border border-border rounded-lg bg-card overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 max-w-3xl mx-auto">
          {isEmpty && (
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto rounded-xl bg-gold/15 flex items-center justify-center mb-3">
                <Bot className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-semibold">Como posso ajudar?</h3>
              <p className="text-sm text-muted-foreground mt-1">Pergunte sobre indicadores em linguagem natural.</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} onClick={() => submit(p)} className="px-3 py-1.5 text-xs rounded-full border border-border bg-muted/50 hover:border-gold/50 hover:bg-gold/5 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(messages ?? []).map((m) => (
            <Message key={m.id} role={m.role as "user" | "assistant"} content={m.content} />
          ))}
          {sending && (
            <div className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-md bg-gold/15 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-gold" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando...
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-border p-3 bg-background/40">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pergunte sobre indicadores, vendas, obras, finanças..."
            rows={1}
            className="resize-none min-h-[44px] max-h-32"
            disabled={sending}
          />
          <Button onClick={() => submit()} disabled={sending || !input.trim()} size="icon" className="bg-gold hover:bg-gold/90 text-gold-foreground shrink-0">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Message({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-3 items-start", isUser && "flex-row-reverse")}>
      <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", isUser ? "bg-primary text-primary-foreground" : "bg-gold/15 text-gold")}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn("rounded-lg px-4 py-2 max-w-[80%]", isUser ? "bg-primary text-primary-foreground" : "bg-muted/50 text-foreground")}>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{content}</div>
      </div>
    </div>
  );
}