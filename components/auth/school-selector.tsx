"use client";

import * as React from "react";
import { Check, ChevronsUpDown, School, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SchoolOption {
  id: string;
  name: string;
  shortCode: string | null;
}

interface SchoolSelectorProps {
  value?: string;
  onSelect: (schoolId: string, school: SchoolOption) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function SchoolSelector({
  value,
  onSelect,
  disabled,
  placeholder = "Select your school...",
  className,
}: SchoolSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [schools, setSchools] = React.useState<SchoolOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSchool, setSelectedSchool] = React.useState<SchoolOption | null>(null);

  // Fetch schools when search query changes
  React.useEffect(() => {
    const fetchSchools = async () => {
      if (searchQuery.length < 2) {
        setSchools([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/schools/search?q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSchools(data.schools || []);
        }
      } catch (error) {
        console.error("Failed to fetch schools:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSchools, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Fetch selected school details if value is provided
  React.useEffect(() => {
    const fetchSelectedSchool = async () => {
      if (!value || selectedSchool?.id === value) return;

      try {
        const response = await fetch(`/api/schools/${value}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedSchool(data);
        }
      } catch (error) {
        console.error("Failed to fetch school details:", error);
      }
    };

    fetchSelectedSchool();
  }, [value, selectedSchool?.id]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-11",
            "bg-[hsl(var(--surface-soft))]",
            "border-[hsl(var(--border))]",
            "hover:bg-[hsl(var(--surface-soft))]/80",
            "text-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <School className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selectedSchool ? (
              <span className="truncate text-foreground">
                {selectedSchool.name}
                {selectedSchool.shortCode && (
                  <span className="ml-1 text-muted-foreground">
                    ({selectedSchool.shortCode})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
      >
        <Command shouldFilter={false} className="bg-[hsl(var(--surface-strong))] border-[hsl(var(--border-strong))]">
          <div className="flex items-center border-b border-[hsl(var(--border))] px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search by school name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-11 w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <CommandList className="max-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--accent-violet))]" />
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search...
              </div>
            ) : schools.length === 0 ? (
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No school found.
              </CommandEmpty>
            ) : (
              <CommandGroup className="p-1">
                {schools.map((school) => (
                  <CommandItem
                    key={school.id}
                    value={school.id}
                    onSelect={() => {
                      setSelectedSchool(school);
                      onSelect(school.id, school);
                      setOpen(false);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-2 hover:bg-[hsl(var(--surface-soft))] text-foreground"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-[hsl(var(--accent-violet))]",
                        value === school.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{school.name}</span>
                      {school.shortCode && (
                        <span className="text-xs text-muted-foreground">
                          Code: {school.shortCode}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
