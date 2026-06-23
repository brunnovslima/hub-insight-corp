import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Sem dados para exibir",
  description = "Ainda não há registros no período ou filtro selecionado. Ajuste os filtros ou volte mais tarde.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-10 rounded-lg border border-dashed border-border bg-card/30", className)}>
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}