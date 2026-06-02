import { useState, useMemo } from "react";
import { Tooltip } from "@/common/Tooltip";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Pagination from "@/common/Pagination";

// ============================================
// 📦 Type Definitions
// ============================================

export type ColumnAlignment = "left" | "center" | "right";

export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Accessor function or key path to get the value from data */
  accessor?: keyof T | ((row: T) => unknown);
  /** Custom render function for cell content */
  render?: (row: T, index: number) => React.ReactNode;
  /** Column alignment */
  align?: ColumnAlignment;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Custom width (e.g., "200px", "20%", "auto") */
  width?: string;
  /** Hide column on mobile */
  hideOnMobile?: boolean;
  /** Disable automatic tooltip for this column */
  showTooltip?: boolean;
}

export interface DynamicTableProps<T> {
  /** Array of data to display */
  data: T[];
  /** Column configuration */
  columns: Column<T>[];
  /** Enable row selection with checkboxes */
  selectable?: boolean;
  /** Callback when row selection changes */
  onSelectionChange?: (selectedRows: T[]) => void;
  /** Enable pagination */
  pagination?: boolean;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Enable search/filter */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Custom search function */
  onSearch?: (query: string, data: T[]) => T[];
  /** Row actions (edit, delete, etc.) */
  actions?: {
    label: string;
    onClick: (row: T, index: number) => void;
    icon?: React.ReactNode;
    variant?: "primary" | "danger" | "secondary";
  }[];
  /** Bulk actions for selected rows */
  bulkActions?: {
    label: string;
    onClick: (selectedRows: T[]) => void;
    icon?: React.ReactNode;
    variant?: "primary" | "danger" | "secondary";
  }[];
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Custom row key extractor */
  getRowKey?: (row: T, index: number) => string | number;
  /** Custom row className */
  rowClassName?: (row: T, index: number) => string;
  /** Enable hover effect on rows */
  hoverable?: boolean;
  /** Enable striped rows */
  striped?: boolean;
  /** Table title */
  title?: string;
}

// ============================================
// 🎨 Component
// ============================================

const DynamicTable = <T extends Record<string, unknown>>({
  data,
  columns,
  selectable = false,
  onSelectionChange,
  pagination = false,
  pageSize = 10,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  actions,
  bulkActions,
  emptyMessage = "No data available",
  loading = false,
  getRowKey,
  rowClassName,
  hoverable = true,
  striped = false,
  title,
}: DynamicTableProps<T>) => {
  // ============================================
  // 📊 State Management
  // ============================================
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(
    new Set(),
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // ============================================
  // 🔍 Search & Filter Logic
  // ============================================
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    if (onSearch) {
      return onSearch(searchQuery, data);
    }

    // Default search: search all string values
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    );
  }, [data, searchQuery, onSearch]);

  // ============================================
  // 🔀 Sorting Logic
  // ============================================
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const column = columns.find((col) => col.key === sortConfig.key);
      if (!column) return 0;

      let aValue: unknown;
      let bValue: unknown;

      if (typeof column.accessor === "function") {
        aValue = column.accessor(a);
        bValue = column.accessor(b);
      } else if (column.accessor) {
        aValue = a[column.accessor];
        bValue = b[column.accessor];
      } else {
        return 0;
      }

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredData, sortConfig, columns]);

  // ============================================
  // 📄 Pagination Logic
  // ============================================
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // ============================================
  // 🎯 Event Handlers
  // ============================================
  const handleSort = (columnKey: string) => {
    setSortConfig((prev) => {
      if (prev?.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key: columnKey, direction: "asc" };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = paginatedData.map((row, index) =>
        getRowKey ? getRowKey(row, index) : index,
      );
      setSelectedRows(new Set(allKeys));

      if (onSelectionChange) {
        onSelectionChange(paginatedData);
      }
    } else {
      setSelectedRows(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectRow = (rowKey: string | number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowKey);
    } else {
      newSelected.delete(rowKey);
    }
    setSelectedRows(newSelected);

    if (onSelectionChange) {
      const selectedData = data.filter((row, index) =>
        newSelected.has(getRowKey ? getRowKey(row, index) : index),
      );
      onSelectionChange(selectedData);
    }
  };

  const toggleRowExpansion = (rowKey: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }
    setExpandedRows(newExpanded);
  };

  const getCellValue = (row: T, column: Column<T>) => {
    if (column.render) {
      return column.render(row, data.indexOf(row));
    }

    if (typeof column.accessor === "function") {
      return String(column.accessor(row));
    }

    if (column.accessor) {
      return String(row[column.accessor] ?? "");
    }

    return "";
  };

  const getTooltipText = (row: T, column: Column<T>) => {
    if (column.showTooltip === false) return "";
    if (typeof column.accessor === "function") {
      return String(column.accessor(row));
    }
    if (column.accessor) {
      const val = row[column.accessor as keyof T];
      if (typeof val === "string" || typeof val === "number")
        return String(val);
    }

    // If no accessor, check the data object using the key
    const value = row[column.key as keyof T];
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    // Handle objects (e.g., { name: '...' })
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if (typeof obj.name === "string") return obj.name;
      if (typeof obj.label === "string") return obj.label;
    }

    // Handle arrays (e.g., [{ name: '...' }])
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string" || typeof item === "number")
            return String(item);
          if (item && typeof item === "object") {
            const obj = item as Record<string, unknown>;
            return String(obj.name || obj.label || "");
          }
          return "";
        })
        .filter(Boolean)
        .join(", ");
    }

    return "";
  };

  const getAlignmentClass = (align?: ColumnAlignment) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  // ============================================
  // 🎨 Render
  // ============================================
  return (
    <div className="w-full bg-primary-background rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Table Header / Toolbar */}
      <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border">
        {title && (
          <h2 className="text-xl font-bold text-primary-text">{title}</h2>
        )}

        <div className="flex items-center gap-3 ml-auto">
          {searchable && (
            <div className="relative w-full max-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-light-background border border-border rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-primary-brand/10 focus:bg-primary-background text-primary-text transition-all"
              />
            </div>
          )}

          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold text-secondary-text hover:bg-light-background transition-all min-w-fit">
            <Filter className="h-4 w-4" />
            Filter By
          </button>
        </div>
      </div>

      {/* Selected Items Toolbar */}
      {selectable && selectedRows.size > 0 && (
        <div className="px-6 py-3 bg-primary-brand/[0.03] border-b border-border flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-primary-brand dark:text-slate-100 bg-primary-brand/10 px-3 py-1 rounded-full border border-primary-brand/20">
              {selectedRows.size} Selected
            </span>
            <div className="h-4 w-px bg-border" />

            {bulkActions && (
              <div className="flex items-center gap-1">
                {bulkActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const selectedData = data.filter((row, index) =>
                        selectedRows.has(
                          getRowKey ? getRowKey(row, index) : index,
                        ),
                      );
                      action.onClick(selectedData);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all",
                      action.variant === "danger"
                        ? "text-rose-500 hover:bg-rose-500/10"
                        : action.variant === "primary"
                          ? "text-primary-brand hover:bg-primary-brand/5"
                          : "text-secondary-text hover:bg-light-background",
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💻 Desktop Table View */}
      <div className="hidden md:block w-full overflow-hidden">
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-border">
          <table className="w-full table-auto border-collapse min-w-full">
            <thead>
              <tr className="bg-light-background border-b border-border">
                {selectable && (
                  <th className="px-6 py-4 w-12 text-left">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          paginatedData.length > 0 &&
                          selectedRows.size === paginatedData.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-brand focus:ring-primary-brand/20 transition-all cursor-pointer"
                      />
                    </div>
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-6 py-4 text-[13px] font-bold text-secondary-text uppercase tracking-tight whitespace-nowrap",
                      getAlignmentClass(column.align),
                      column.hideOnMobile ? "hidden lg:table-cell" : "",
                    )}
                    style={{ width: column.width }}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="group flex items-center gap-2 hover:text-primary-text transition-colors w-full"
                      >
                        {column.label}
                        <div className="flex flex-col text-gray-400 group-hover:text-primary-brand transition-colors">
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === "asc" ? (
                              <ChevronUp
                                size={14}
                                className="text-primary-brand"
                              />
                            ) : (
                              <ChevronDown
                                size={14}
                                className="text-primary-brand"
                              />
                            )
                          ) : (
                            <ChevronsUpDown size={14} className="opacity-50" />
                          )}
                        </div>
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="px-6 py-4 text-[13px] font-bold text-gray-500 uppercase tracking-tight text-center">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="">
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)
                    }
                    className="px-6 py-20 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-[3px] border-primary-brand/20 border-t-primary-brand rounded-full animate-spin" />
                      <p className="text-sm font-semibold text-gray-400">
                        Loading data...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)
                    }
                    className="px-6 py-20 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">
                        {emptyMessage}
                      </p>
                      <p className="text-xs text-gray-400">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const rowKey = getRowKey ? getRowKey(row, index) : index;
                  const isSelected = selectedRows.has(rowKey);

                  return (
                    <tr
                      key={rowKey}
                      className={cn(
                        "transition-all duration-200 border-b border-border last:border-0",
                        striped
                          ? index % 2 === 0
                            ? "bg-stripe-1"
                            : "bg-stripe-2"
                          : "bg-primary-background",
                        hoverable &&
                          "hover:bg-primary-brand/5 hover:shadow-[inset_4px_0_0_0_var(--secondary-brand)]",
                        isSelected &&
                          "bg-primary-brand/[0.02] shadow-[inset_4px_0_0_0_var(--secondary-brand)]",
                        rowClassName?.(row, index),
                      )}
                    >
                      {selectable && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleSelectRow(rowKey, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-primary-brand focus:ring-primary-brand/20 transition-all cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            "px-6 py-4 text-sm font-semibold text-primary-text",
                            getAlignmentClass(column.align),
                            column.hideOnMobile ? "hidden lg:table-cell" : "",
                          )}
                        >
                          <Tooltip content={getTooltipText(row, column)}>
                            <div
                              className={cn(
                                !column.render && "truncate",
                                "w-full",
                              )}
                              style={{ maxWidth: column.width || "none" }}
                            >
                              {getCellValue(row, column)}
                            </div>
                          </Tooltip>
                        </td>
                      ))}
                      {actions && actions.length > 0 && (
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {actions.map((action, idx) => (
                              <Tooltip key={idx} content={action.label}>
                                <button
                                  onClick={() => action.onClick(row, index)}
                                  className={cn(
                                    "p-2 rounded-lg transition-all hover:scale-110",
                                    action.variant === "danger"
                                      ? "text-red-400 hover:bg-red-500/10 hover:text-red-500"
                                      : "text-secondary-text hover:bg-light-background hover:text-primary-brand",
                                  )}
                                >
                                  {action.icon}
                                </button>
                              </Tooltip>
                            ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📱 Mobile Card View */}
      <div className="md:hidden w-full divide-y divide-border">
        {selectable && paginatedData.length > 0 && (
          <div className="px-4 py-3 bg-light-background flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  paginatedData.length > 0 &&
                  selectedRows.size === paginatedData.length
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary-brand focus:ring-primary-brand/20 transition-all cursor-pointer bg-primary-background"
              />
              <span className="text-sm font-bold text-primary-text">
                Select All
              </span>
            </div>
            <span className="text-xs font-bold text-gray-400">
              {paginatedData.length} Items
            </span>
          </div>
        )}

        {loading ? (
          <div className="px-6 py-20 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-[3px] border-primary-brand/20 border-t-primary-brand rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-400">
                Loading data...
              </p>
            </div>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-sm font-bold text-primary-text">
              {emptyMessage}
            </p>
          </div>
        ) : (
          paginatedData.map((row, index) => {
            const rowKey = getRowKey ? getRowKey(row, index) : index;
            const isSelected = selectedRows.has(rowKey);
            const isExpanded = expandedRows.has(rowKey);
            const visibleColumns = columns.filter((col) => !col.hideOnMobile);
            const primaryColumns = visibleColumns.slice(0, 2);
            const secondaryColumns = visibleColumns.slice(2);

            return (
              <div
                key={rowKey}
                className={cn(
                  "p-4 transition-all duration-200",
                  isSelected
                    ? "bg-primary-brand/[0.02]"
                    : striped && index % 2 !== 0
                      ? "bg-[var(--bg-stripe-2)]"
                      : "bg-[var(--bg-stripe-1)]",
                  selectable && "pr-8 sm:pr-10",
                )}
              >
                <div className="flex items-start gap-4">
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        handleSelectRow(rowKey, e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-border text-primary-brand focus:ring-primary-brand/20 bg-primary-background"
                    />
                  )}

                  <div className="flex-1 space-y-3">
                    {/* Primary Columns */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {primaryColumns.map((column, colIdx) => (
                        <div
                          key={column.key}
                          className={cn(
                            "flex flex-col items-start gap-0.5 rounded-lg p-2 transition-colors",
                            striped && colIdx % 2 !== 0
                              ? "bg-[var(--bg-stripe-2)]"
                              : "bg-transparent",
                          )}
                        >
                          <span className="text-[10px] font-bold text-secondary-text/60 uppercase tracking-wider">
                            {column.label}
                          </span>
                          <Tooltip content={getTooltipText(row, column)}>
                            <div className="text-[13px] font-semibold text-primary-text leading-tight truncate w-full">
                              {getCellValue(row, column)}
                            </div>
                          </Tooltip>
                        </div>
                      ))}
                    </div>

                    {/* Expandable Content - Two Column Layout with Zebra Fields */}
                    {isExpanded && secondaryColumns.length > 0 && (
                      <div className="grid grid-cols-1 gap-y-1 pt-3 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
                        {secondaryColumns.map((column, colIdx) => (
                          <div
                            key={column.key}
                            className={cn(
                              "flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg transition-colors",
                              striped && colIdx % 2 !== 0
                                ? "bg-[var(--bg-stripe-2)]"
                                : "bg-transparent",
                            )}
                          >
                            <span className="text-[11px] font-bold text-secondary-text/60 uppercase tracking-wider whitespace-nowrap">
                              {column.label}
                            </span>
                            <Tooltip
                              content={getTooltipText(row, column)}
                              className="right-0 translate-x-0"
                            >
                              <div className="text-[13px] font-bold text-primary-text leading-tight text-right truncate max-w-[150px]">
                                {getCellValue(row, column)}
                              </div>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mobile Actions & Toggle */}
                    <div
                      className={cn(
                        "flex items-center justify-between",
                        isExpanded
                          ? "pt-3 border-t border-border mt-1"
                          : "pt-2",
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {actions &&
                          actions.map((action, idx) => (
                            <Tooltip key={idx} content={action.label}>
                              <button
                                onClick={() => action.onClick(row, index)}
                                className={cn(
                                  "p-1.5 rounded-sm transition-all border shadow-sm",
                                  action.variant === "danger"
                                    ? "text-red-500 border-red-500/20 bg-light-background"
                                    : "text-blue-500 border-blue-500/20 bg-light-background",
                                )}
                              >
                                <div className="scale-90">{action.icon}</div>
                              </button>
                            </Tooltip>
                          ))}
                      </div>

                      {secondaryColumns.length > 0 && (
                        <button
                          onClick={() => toggleRowExpansion(rowKey)}
                          className="flex items-center gap-1 text-[11px] font-bold text-primary-brand hover:opacity-80 transition-all bg-primary-brand/5 px-2.5 py-1.5 rounded-sm"
                        >
                          {isExpanded ? "Show Less" : "Show More"}
                          {isExpanded ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Container */}
      {pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={pageSize}
          totalItems={sortedData.length}
          onPageChange={setCurrentPage}
          label="entries"
        />
      )}
    </div>
  );
};

export default DynamicTable;
