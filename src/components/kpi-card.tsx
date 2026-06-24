import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KpiCardProps {
  title: string;
  value: ReactNode;
  hint?: string;
  delta?: number;
  icon?: ReactNode;
  tone?: "default" | "gold" | "primary";
  className?: string;
  /** Numeric series for a mini sparkline. */
  sparkline?: number[];
  /** Tooltip text explaining the indicator. */
  description?: string;
}

export function KpiCard({
  title,
  value,
  hint,
  delta,
  icon,
  tone = "default",
  className,
  sparkline,
  description,
}: KpiCardProps) {
  const TrendIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta == null ? "text-muted-foreground" : delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground";

  const sparkData = sparkline && sparkline.length > 1 ? sparkline.map((v, i) => ({ i, v })) : null;
  const sparkColor = tone === "primary" ? "var(--gold)" : "var(--gold)";
  const sparkId = `spark-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/60 transition-shadow hover:shadow-[var(--shadow-elegant)]",
        tone === "gold" && "border-gold/40 bg-gradient-to-br from-card to-gold/5",
        tone === "primary" && "bg-[var(--gradient-primary)] border-0",
        className,
      )}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <CardTitle
            className={cn(
              "text-xs font-medium uppercase tracking-wider truncate",
              tone === "primary" ? "text-gold" : "text-muted-foreground",
            )}
          >
            {title}
          </CardTitle>
          {description && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label={`Sobre ${title}`} className={cn("opacity-60 hover:opacity-100 transition-opacity", tone === "primary" && "text-gold")}>
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">{description}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {icon && <div className="text-gold shrink-0">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className={cn("text-2xl font-bold tracking-tight truncate", tone === "primary" && "text-gold")}>{value}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {delta != null && (
                <span className={cn("inline-flex items-center gap-0.5 font-medium", deltaColor)}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(delta).toFixed(1)}%
                </span>
              )}
              {hint && (
                <span className={cn(tone === "primary" ? "text-gold/80" : "text-muted-foreground")}>{hint}</span>
              )}
            </div>
          </div>
          {sparkData && (
            <div className="h-10 w-20 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <defs>
                    <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sparkColor} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} fill={`url(#${sparkId})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}