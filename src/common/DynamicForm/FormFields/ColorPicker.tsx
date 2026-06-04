import { cn } from "@/lib/utils";
import { Pipette } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
  className?: string;
}

export const ColorPicker = ({
  value = "#3B82F6",
  onChange,
  error,
  className,
}: ColorPickerProps) => {
  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

  const handleEyeDropper = async () => {
    if (!hasEyeDropper) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        onChange(result.sRGBHex);
      }
    } catch (e) {
      console.warn("EyeDropper closed/failed:", e);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 bg-light-background border border-border rounded-lg p-0.5 h-11 transition-all duration-200 focus-within:bg-primary-background focus-within:ring-4 focus-within:ring-primary-brand/10",
      error && "border-red-500",
      className
    )}>
      <div className="relative w-10 h-full rounded-l-[7px] overflow-hidden border-r border-border shadow-sm">
        <input
          type="color"
          value={value || "#3B82F6"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
        />
      </div>
      <div className="flex-1 flex items-center gap-2 px-2">
        <span className="text-xs font-bold text-secondary-text font-mono">HEX</span>
        <input
          type="text"
          value={value || "#3B82F6"}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="bg-transparent border-0 outline-none text-sm font-bold uppercase font-mono w-full text-primary-text placeholder:text-secondary-text"
        />
      </div>
      {hasEyeDropper && (
        <button
          type="button"
          onClick={handleEyeDropper}
          className="mr-1.5 p-1.5 rounded-md hover:bg-light-background text-secondary-text hover:text-primary-text transition-colors cursor-pointer flex items-center justify-center"
          title="Pick color from screen"
        >
          <Pipette className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
