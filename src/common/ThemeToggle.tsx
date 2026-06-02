import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-full transition-all duration-300 group",
        "hover:bg-primary-brand/10 dark:hover:bg-white/10",
        "border border-transparent hover:border-primary-brand/20 dark:hover:border-white/20",
        className
      )}
      aria-label="Toggle theme"
    >
      <div className="relative h-5 w-5 overflow-hidden">
        <Sun
          className={cn(
            "h-5 w-5 transition-all duration-500 absolute",
            theme === "dark" ? "-top-full rotate-90 opacity-0" : "top-0 rotate-0 opacity-100",
            "text-amber-500"
          )}
        />
        <Moon
          className={cn(
            "h-5 w-5 transition-all duration-500 absolute",
            theme === "light" ? "top-full -rotate-90 opacity-0" : "top-0 rotate-0 opacity-100",
            "text-indigo-400"
          )}
        />
      </div>
      
      {/* Subtle glow effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300",
        theme === "light" ? "bg-amber-400" : "bg-indigo-400"
      )} />
    </button>
  );
};
