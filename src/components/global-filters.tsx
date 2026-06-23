import { useEffect, useState } from "react";
import { CalendarRange, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export type Period = "month" | "quarter" | "year" | "custom";

export interface GlobalFilterValue {
  period: Period;
  empreendimentoId: string;
}

interface Props {
  value: GlobalFilterValue;
  onChange: (next: GlobalFilterValue) => void;
  hideEmpreendimento?: boolean;
}

const PERIOD_LABEL: Record<Period, string> = {
  month: "Mês atual",
  quarter: "Trimestre",
  year: "Ano",
  custom: "Personalizado",
};

export function GlobalFilters({ value, onChange, hideEmpreendimento }: Props) {
  const [empreendimentos, setEmpreendimentos] = useState<{ id: string; nome: string }[]>([]);

  useEffect(() => {
    if (hideEmpreendimento) return;
    let active = true;
    supabase
      .from("empreendimentos")
      .select("id, nome")
      .order("nome")
      .then(({ data }) => {
        if (active && data) setEmpreendimentos(data as { id: string; nome: string }[]);
      });
    return () => {
      active = false;
    };
  }, [hideEmpreendimento]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <CalendarRange className="h-4 w-4 text-muted-foreground" />
        <Select value={value.period} onValueChange={(v) => onChange({ ...value, period: v as Period })}>
          <SelectTrigger className="h-9 w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <SelectItem key={p} value={p}>{PERIOD_LABEL[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!hideEmpreendimento && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={value.empreendimentoId} onValueChange={(v) => onChange({ ...value, empreendimentoId: v })}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="Todos os empreendimentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os empreendimentos</SelectItem>
              {empreendimentos.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export const defaultFilters: GlobalFilterValue = { period: "year", empreendimentoId: "all" };