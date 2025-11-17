"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SchoolOption = {
  id: string;
  name: string;
  shortCode?: string | null;
};

interface Props {
  initialSchool: SchoolOption | null;
  className?: string;
}

export function SchoolSwitcher({ initialSchool, className }: Props) {
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolOption[]>(initialSchool ? [initialSchool] : []);
  const [selected, setSelected] = useState<string>(initialSchool?.id ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    fetch("/api/schools")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setSchools(data);
          if (!selected && data.length) {
            setSelected(data[0].id);
          }
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [selected]);

  function handleChange(value: string) {
    setSelected(value);
    startTransition(async () => {
      await fetch("/api/schools/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: value }),
      });
      router.refresh();
    });
  }

  return (
    <Select value={selected} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className={cn("w-[200px]", className)}>
        <SelectValue placeholder="Select school" />
      </SelectTrigger>
      <SelectContent>
        {schools.map((school) => (
          <SelectItem key={school.id} value={school.id}>
            {school.shortCode ? `${school.shortCode} · ${school.name}` : school.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

