import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Option } from "./FieldTypes";

interface SelectFieldProps {
  options: (string | Option)[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export const SelectField = ({
  options = [],
  value,
  onChange,
  placeholder = "Select option...",
  error,
  className,
}: SelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((opt: string | Option) => {
    const label = typeof opt === "string" ? opt : opt.label;
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const selectedOption = options.find((opt: string | Option) =>
    typeof opt === "string" ? opt === value : opt.value.toString() === value
  );
  
  const selectedLabel = selectedOption
    ? typeof selectedOption === "string"
      ? selectedOption
      : selectedOption.label
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-11 px-4 bg-light-background border-border font-normal hover:bg-light-background/80 transition-all rounded-lg text-primary-text",
            error && "border-red-500",
            !value && "text-secondary-text",
            className
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 shadow-xl border-border bg-primary-background rounded-lg overflow-hidden" 
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <div className="flex items-center border-b border-border px-3 h-10">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-full w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-secondary-text text-primary-text disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1 space-y-1">
          {filteredOptions.length === 0 && (
            <div className="py-6 text-center text-sm text-secondary-text">
              No results found.
            </div>
          )}
          {filteredOptions.map((opt: string | Option) => {
            const val = typeof opt === "string" ? opt : opt.value.toString();
            const label = typeof opt === "string" ? opt : opt.label;
            const isSelected = value === val;

            return (
              <div
                key={val}
                onClick={() => {
                  onChange(isSelected ? "" : val);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none hover:bg-primary-brand/5 hover:text-primary-text transition-colors mx-1",
                  isSelected && "bg-primary-brand/10 text-primary-text font-medium"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                {label}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
