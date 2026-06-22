import { createFileRoute } from "@tanstack/react-router";
import { Bot, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: Empty,
});

function Empty() {
  return (
    <div className="h-full flex items-center justify-center border border-dashed border-border rounded-lg bg-card/50">
      <div className="text-center max-w-sm px-6">
        <div className="h-14 w-14 mx-auto rounded-xl bg-gold/15 flex items-center justify-center mb-3">
          <Bot className="h-7 w-7 text-gold" />
        </div>
        <h3 className="font-semibold text-lg">Assistente de Dados Corporativos</h3>
        <p className="text-sm text-muted-foreground mt-2">
          <Sparkles className="h-3.5 w-3.5 inline mr-1 text-gold" />
          Crie uma nova conversa para perguntar sobre VGV, vendas, obras e indicadores financeiros.
        </p>
      </div>
    </div>
  );
}