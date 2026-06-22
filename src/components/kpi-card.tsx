import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: ReactNode;
  hint?: string;
  delta?: number;
  icon?: ReactNode;
  tone?: "default" | "gold" | "primary";
  className?: string;
}

export function KpiCard({ title, value, hint, delta, icon, tone = "default", className }: KpiCardProps) {
  const TrendIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta == null ? "text-muted-foreground" : delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/60 transition-shadow hover:shadow-[var(--shadow-elegant)]",
        tone === "gold" && "border-gold/40 bg-gradient-to-br from-card to-gold/5",
        tone === "primary" && "bg-[var(--gradient-primary)] text-primary-foreground border-0",
        className,
      )}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle
          className={cn(
            "text-xs font-medium uppercase tracking-wider",
            tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {title}
        </CardTitle>
        {icon && <div className={tone === "primary" ? "text-gold" : "text-gold"}>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tracking-tight", tone === "primary" && "text-primary-foreground")}>{value}</div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {delta != null && (
            <span className={cn("inline-flex items-center gap-0.5", deltaColor)}>
              <TrendIcon className="h-3 w-3" />
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {hint && (
            <span className={cn(tone === "primary" ? "text-primary-foreground/70" : "text-muted-foreground")}>{hint}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}