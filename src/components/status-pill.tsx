import { cn } from "@/lib/utils";

type Status = "ok" | "warn" | "crit" | "neutral";

const map: Record<Status, string> = {
  ok: "bg-success/15 text-success border-success/30",
  warn: "bg-warning/15 text-warning border-warning/40",
  crit: "bg-destructive/15 text-destructive border-destructive/40",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status, children }: { status: Status; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", map[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "ok" && "bg-success", status === "warn" && "bg-warning", status === "crit" && "bg-destructive", status === "neutral" && "bg-muted-foreground")} />
      {children}
    </span>
  );
}