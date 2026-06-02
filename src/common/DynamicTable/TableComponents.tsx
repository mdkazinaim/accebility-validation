import { cn } from "@/lib/utils";

interface StatusPillProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

export const StatusPill = ({ label, variant = "neutral", className }: StatusPillProps) => {
  const variants = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    neutral: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  );
};
