import { createFileRoute, Outlet, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat IA" }] }),
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };

  const { data: threads } = useQuery({
    queryKey: ["chat-threads"],
    queryFn: async () => {
      const r = await supabase.from("chat_threads").select("*").order("updated_at", { ascending: false });
      return r.data ?? [];
    },
  });

  const createThread = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ user_id: u.user.id, title: "Nova conversa" })
      .select("id")
      .single();
    if (error || !data) return toast.error("Não foi possível criar a conversa");
    qc.invalidateQueries({ queryKey: ["chat-threads"] });
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  };

  const deleteThread = async (id: string) => {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["chat-threads"] });
    if (params.threadId === id) navigate({ to: "/chat" });
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      <aside className="w-72 shrink-0 flex flex-col border border-border rounded-lg bg-card">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2"><Bot className="h-4 w-4 text-gold" /> Conversas</h2>
          <Button size="sm" variant="ghost" onClick={createThread}><Plus className="h-4 w-4" /></Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {(threads ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground p-3">Nenhuma conversa ainda.</p>
            )}
            {(threads ?? []).map((t) => {
              const active = params.threadId === t.id;
              return (
                <div key={t.id} className={cn("group flex items-center rounded-md transition-colors", active ? "bg-accent/15 border border-gold/30" : "hover:bg-muted")}>
                  <Link
                    to="/chat/$threadId"
                    params={{ threadId: t.id }}
                    className="flex-1 flex items-center gap-2 p-2 min-w-0"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{t.title}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteThread(t.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}