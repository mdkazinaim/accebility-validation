import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ============================================
// 📅 Date Picker
// ============================================

interface DatePickerProps {
  value: Date | string | null;
  onChange: (val: Date | null) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export const DatePicker = ({
  value,
  onChange,
  placeholder = "Pick a date",
  error,
  className,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const dateValue = value ? (value instanceof Date ? value : new Date(value)) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start h-11 px-4 bg-light-background border-border font-normal hover:bg-light-background/80 transition-all text-left rounded-lg text-primary-text",
            error && "border-red-500",
            !value && "text-secondary-text",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {dateValue ? dateValue.toLocaleDateString() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 bg-primary-background shadow-2xl border-border rounded-lg overflow-hidden" 
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <div className="custom-calendar-wrapper p-2">
          <Calendar
            onChange={(val) => {
              onChange(val as Date);
              setOpen(false);
            }}
            value={dateValue}
            className="border-none font-inter w-full"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ============================================
// 📅 Date Time Picker
// ============================================

interface DateTimePickerProps {
  value: Date | string | null;
  onChange: (val: Date | null) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export const DateTimePicker = ({
  value,
  onChange,
  placeholder = "Pick date and time",
  error,
  className,
}: DateTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const dateValue = value ? (value instanceof Date ? value : new Date(value)) : null;

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":");
    const newDate = dateValue ? new Date(dateValue) : new Date();
    newDate.setHours(parseInt(hours), parseInt(minutes));
    onChange(newDate);
  };

  const timeValue = dateValue ? `${String(dateValue.getHours()).padStart(2, "0")}:${String(dateValue.getMinutes()).padStart(2, "0")}` : "12:00";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start h-11 px-4 bg-light-background border-border font-normal hover:bg-light-background/80 transition-all text-left rounded-lg text-primary-text",
            error && "border-red-500",
            !value && "text-secondary-text",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {dateValue ? dateValue.toLocaleString() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 bg-primary-background shadow-2xl border-border rounded-lg overflow-hidden" 
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        <div className="p-3 space-y-4">
          <div className="custom-calendar-wrapper">
            <Calendar
              onChange={(val) => {
                const newDate = val as Date;
                if (dateValue) {
                  newDate.setHours(dateValue.getHours(), dateValue.getMinutes());
                }
                onChange(newDate);
              }}
              value={dateValue}
              className="border-none font-inter w-full"
            />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Label className="text-xs font-bold text-secondary-text uppercase tracking-wider">Select Time</Label>
            <input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="h-9 px-3 rounded-lg border border-border bg-light-background text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary-brand/10 text-primary-text"
            />
          </div>
          <Button className="w-full h-10 font-semibold rounded-lg" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
