"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CategoryOption {
  id: string;
  name: string;
  level?: number;
}

interface CategoryMultiSelectProps {
  options: CategoryOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function CategoryMultiSelect({ options, value, onChange }: CategoryMultiSelectProps) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const label =
    value.length === 0
      ? "All categories"
      : value.length === 1
      ? options.find((o) => o.id === value[0])?.name ?? "1 selected"
      : `${value.length} categories`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between sm:w-64"
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              {value.length > 0 && (
                <CommandItem onSelect={() => onChange([])} className="text-muted-foreground">
                  Clear selection
                </CommandItem>
              )}
              {options.map((opt) => {
                const selected = value.includes(opt.id);
                return (
                  <CommandItem
                    key={opt.id}
                    value={opt.name}
                    onSelect={() => toggle(opt.id)}
                    style={{ paddingLeft: 8 + (opt.level ?? 0) * 14 }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                    {opt.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
