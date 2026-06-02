import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  label?: string;
}

const Pagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  label = "Results",
}: PaginationProps) => {
  const getPageButtons = () => {
    const buttons: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      // Show first 2, last, current ±1
      if (
        i === 1 ||
        i === 2 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        buttons.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        buttons.push("...");
      }
    }

    // Remove duplicate "..."
    return buttons.filter(
      (btn, idx, arr) => !(btn === "..." && arr[idx - 1] === "..."),
    );
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 border-t border-border bg-primary-background">
      {/* Showing X-Y of Z */}
      <div className="text-[14px] font-medium text-secondary-text">
        Showing{" "}
        <span className="text-primary-text font-semibold">
          {startItem}-{endItem}
        </span>{" "}
        of <span className="text-primary-text font-semibold">{totalItems}</span>{" "}
        {label}
      </div>

      {/* Pagination Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          {/* Prev Button */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold border border-border rounded-lg text-secondary-text hover:bg-light-background disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
            Prev
          </button>

          {/* Page Buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            {getPageButtons().map((btn, idx) =>
              btn === "..." ? (
                <span
                  key={idx}
                  className="w-9 text-center text-secondary-text/40 font-bold"
                >
                  ...
                </span>
              ) : (
                <button
                  key={idx}
                  onClick={() => onPageChange(btn as number)}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center text-sm font-bold rounded-lg transition-all",
                    currentPage === btn
                      ? "bg-primary-brand text-white shadow-sm shadow-primary-brand/20"
                      : "text-secondary-text hover:bg-light-background border border-border hover:border-border",
                  )}
                >
                  {btn}
                </button>
              ),
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold border border-border rounded-lg text-secondary-text hover:bg-light-background disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
