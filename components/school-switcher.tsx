"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const { schoolIds, isLoading: authLoading, user } = useAuth();
  const [schools, setSchools] = useState<SchoolOption[]>(initialSchool ? [initialSchool] : []);
  const [selected, setSelected] = useState<string>(initialSchool?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    // Only fetch if we have an authenticated user
    if (authLoading || !user) return;
    
    let mounted = true;
    fetch("/api/schools", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setSchools(data);
          setFetchError(false);
          // Auto-select first school if none selected
          if (!selected && data.length) {
            setSelected(data[0].id);
          }
        }
      })
      .catch(() => {
        if (mounted) setFetchError(true);
      });
    return () => {
      mounted = false;
    };
  }, [authLoading, user, selected]);

  function handleChange(value: string) {
    // Only allow switching to schools user has access to
    if (!schoolIds.includes(value) && schoolIds.length > 0) {
      return;
    }
    
    setSelected(value);
    startTransition(async () => {
      const res = await fetch("/api/schools/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ schoolId: value }),
      });
      
      if (res.ok) {
        router.refresh();
      }
    });
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className={cn("w-[200px] h-9 rounded-md border border-input bg-background animate-pulse", className)} />
    );
  }

  // If only one school, show as badge
  if (schools.length === 1) {
    return (
      <Badge variant="outline" className={cn("flex items-center gap-1.5 px-3 py-1.5", className)}>
        <Building2 className="h-3.5 w-3.5" />
        <span>{schools[0].shortCode ?? schools[0].name}</span>
      </Badge>
    );
  }

  return (
    <Select value={selected} onValueChange={handleChange} disabled={isPending || fetchError}>
      <SelectTrigger className={cn("w-[200px]", className)}>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Select school" />
        </div>
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

