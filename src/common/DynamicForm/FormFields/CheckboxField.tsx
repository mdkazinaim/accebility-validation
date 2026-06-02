import { cn } from "@/lib/utils";
import type { Option } from "./FieldTypes";

interface CheckboxFieldProps {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
  required?: boolean;
  error?: boolean;
  className?: string;
}

export const CheckboxField = ({
  label,
  value,
  onChange,
  required,
  error,
  className,
}: CheckboxFieldProps) => {
  return (
    <label className={cn("flex items-center space-x-3 cursor-pointer group py-2", className)}>
      <div className="relative flex items-center">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            "peer h-5 w-5 rounded border-gray-300 text-primary-brand focus:ring-primary-brand/20 transition-all cursor-pointer",
            error && "border-red-500"
          )}
        />
      </div>
      <span className="text-sm font-semibold text-foreground/80 group-hover:text-primary-text transition-colors">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
    </label>
  );
};

interface CheckboxGroupFieldProps {
  options: (string | Option)[];
  value: (string | number)[];
  onChange: (val: (string | number)[]) => void;
  inline?: boolean;
  error?: boolean;
  className?: string;
}

export const CheckboxGroupField = ({
  options = [],
  value = [],
  onChange,
  inline = false,
  error,
  className,
}: CheckboxGroupFieldProps) => {
  const toggleOption = (optValue: string | number) => {
    const newValue = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue];
    onChange(newValue);
  };

  return (
    <div className={cn(
      "flex gap-4",
      inline ? "flex-row flex-wrap" : "flex-col",
      className
    )}>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const isChecked = value.includes(val);

        return (
          <label key={val.toString()} className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggleOption(val)}
              className={cn(
                "h-5 w-5 rounded border-gray-300 text-primary-brand focus:ring-primary-brand/20 transition-all cursor-pointer",
                error && "border-red-500"
              )}
            />
            <span className="text-sm font-medium text-foreground/80 group-hover:text-primary-text transition-colors">
              {label}
            </span>
          </label>
        );
      })}
    </div>
  );
};
