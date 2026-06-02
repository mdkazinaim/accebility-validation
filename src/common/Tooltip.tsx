import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const Tooltip = ({ 
  content, 
  children, 
  className,
  position = "top" 
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900",
  };

  return (
    <div 
      className="relative flex items-center group w-full"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && content && (
        <div className={cn(
          "absolute px-3 py-1.5 bg-gray-900 text-white text-[11px] font-medium rounded-lg shadow-xl z-[100] whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 pointer-events-none",
          positionClasses[position],
          className
        )}>
          {content}
          <div className={cn(
            "absolute border-[5px] border-transparent",
            arrowClasses[position]
          )} />
        </div>
      )}
    </div>
  );
};
