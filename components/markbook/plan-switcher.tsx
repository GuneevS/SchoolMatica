"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  plans: { id: string; name: string; status: string; year: number }[];
  currentPlanId: string;
}

export function PlanSwitcher({ plans, currentPlanId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (plans.length <= 1) return null;

  return (
    <Select
      value={currentPlanId}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set("planId", value);
        } else {
          params.delete("planId");
        }
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select plan" />
      </SelectTrigger>
      <SelectContent>
        {plans.map((plan) => (
          <SelectItem key={plan.id} value={plan.id}>
            {plan.name} ({plan.year})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
