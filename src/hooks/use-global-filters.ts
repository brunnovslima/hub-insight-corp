import { useState } from "react";
import { defaultFilters, type GlobalFilterValue } from "@/components/global-filters";

export function useGlobalFilters(initial: Partial<GlobalFilterValue> = {}) {
  return useState<GlobalFilterValue>({ ...defaultFilters, ...initial });
}