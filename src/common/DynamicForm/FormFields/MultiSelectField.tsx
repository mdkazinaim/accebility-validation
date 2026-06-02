import { useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Option } from "./FieldTypes";

interface MultiSelectFieldProps {
  options: (string | Option)[];
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export const MultiSelectField = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Select multiple...",
  error,
  className,
}: MultiSelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((opt: string | Option) => {
    const label = typeof opt === "string" ? opt : opt.label;
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const toggleOption = (val: string) => {
    const newValue = value.includes(val)
      ? value.filter((v) => v !== val)
      : [...value, val];
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-[44px] h-auto py-2 px-3 bg-light-background border-border font-normal hover:bg-light-background/80 transition-all rounded-lg text-primary-text",
            error && "border-red-500",
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5">
            {value.length > 0 ? (
              value.map((v) => {
                const opt = options.find((o: string | Option) =>
                  typeof o === "string" ? o === v : o.value.toString() === v
                );
                const label = opt
                  ? typeof opt === "string"
                    ? opt
                    : opt.label
                  : v;
                return (
                  <span
                    key={v}
                    className="bg-primary-brand/10 text-primary-text text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-primary-brand/20"
                  >
                    {label}
                    <button
                      type="button"
                      className="group/remove hover:bg-red-500 rounded-full p-0.5 transition-all"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleOption(v);
                      }}
                    >
                      <X className="h-3 w-3 group-hover/remove:text-white" />
                    </button>
                  </span>
                );
              })
            ) : (
              <span className="text-secondary-text text-sm">
                {placeholder}
              </span>
            )}
          </div>
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
            const isSelected = value.includes(val);

            return (
              <div
                key={val}
                onClick={(e) => {
                  e.preventDefault();
                  toggleOption(val);
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-md px-2 py-2.5 text-sm outline-none hover:bg-primary-brand/5 transition-colors mx-1",
                  isSelected && "bg-primary-brand/10 text-primary-text font-medium"
                )}
              >
                <div
                  className={cn(
                    "mr-3 flex h-4 w-4 items-center justify-center rounded-sm border transition-all",
                    isSelected
                      ? "bg-primary-brand border-primary-brand text-white"
                      : "border-border bg-primary-background opacity-70"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                {label}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
