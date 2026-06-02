import { useState } from "react";
import { Calendar as CalendarIcon, X, Info } from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value: [Date | null, Date | null] | null;
  onChange: (val: [Date | null, Date | null]) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  className?: string;
}

export const DateRangePicker = ({
  value,
  onChange,
  placeholder = "Select Date Range",
  label,
  error,
  className,
}: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const dateRange = value || [null, null];

  const formatShortDate = (d: any) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start h-11 px-4 bg-light-background border-border font-normal hover:bg-light-background/80 transition-all text-left flex items-center gap-2 rounded-lg text-primary-text",
          error && "border-red-500",
        )}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon size={18} className="text-secondary-text" />
        <span className="text-sm font-medium">
          {dateRange[0] || dateRange[1]
            ? `${dateRange[0] ? formatShortDate(dateRange[0]) : ""} - ${dateRange[1] ? formatShortDate(dateRange[1]) : ""}`
            : placeholder}
        </span>
      </Button>

      {open && (
        <div className="absolute top-12 left-0 z-50 bg-primary-background rounded-lg shadow-2xl border border-border p-5 w-full min-w-[320px] animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
            <div>
              <h4 className="text-sm font-bold text-primary-text">
                Select Date Range
              </h4>
              {label && (
                <p className="text-[10px] text-secondary-text uppercase tracking-wider font-semibold">
                  {label}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 w-8 p-0 rounded-full hover:bg-light-background text-secondary-text"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="custom-calendar-wrapper">
            <Calendar
              selectRange={true}
              onChange={(val: any) => {
                onChange(val);
              }}
              value={dateRange}
              className="border-none font-inter w-full"
              nextLabel={<span className="text-secondary-text">&gt;</span>}
              prevLabel={<span className="text-secondary-text">&lt;</span>}
              next2Label={null}
              prev2Label={null}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-start gap-2">
            <Info size={14} className="text-secondary-brand mt-0.5 shrink-0" />
            <p className="text-[11px] text-secondary-text leading-relaxed">
              {Array.isArray(dateRange) && dateRange[0] && dateRange[1] ? (
                <span>
                  Selected:{" "}
                  <span className="font-semibold text-primary-text">
                    {dateRange[0].toLocaleDateString()}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-primary-text">
                    {dateRange[1].toLocaleDateString()}
                  </span>
                </span>
              ) : (
                "Click a start date and then an end date to select a range."
              )}
            </p>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-9 text-xs border border-border rounded-lg text-primary-text hover:bg-light-background"
              onClick={() => {
                onChange([null, null]);
                setOpen(false);
              }}
            >
              Reset
            </Button>
            <Button
              className="flex-1 h-9 text-xs bg-primary-brand hover:bg-primary-brand/90 text-white font-semibold rounded-lg"
              onClick={() => setOpen(false)}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
