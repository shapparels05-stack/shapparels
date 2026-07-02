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

export interface ProductOption {
  id: string;
  name: string;
  code?: string | null;
  basePrice?: string;
}

interface ProductMultiSelectProps {
  options: ProductOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function ProductMultiSelect({ options, value, onChange }: ProductMultiSelectProps) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const label =
    value.length === 0
      ? "Select products…"
      : `${value.length} product${value.length > 1 ? "s" : ""} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or code…" />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              {value.length > 0 && (
                <CommandItem onSelect={() => onChange([])} className="text-muted-foreground">
                  Clear selection
                </CommandItem>
              )}
              {options.map((opt) => {
                const selected = value.includes(opt.id);
                const text = `${opt.code ? opt.code + " " : ""}${opt.name}`;
                return (
                  <CommandItem key={opt.id} value={text} onSelect={() => toggle(opt.id)}>
                    <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{text}</span>
                    {opt.basePrice && (
                      <span className="ml-auto pl-2 text-xs text-muted-foreground">
                        Rs. {parseFloat(opt.basePrice).toLocaleString()}
                      </span>
                    )}
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
