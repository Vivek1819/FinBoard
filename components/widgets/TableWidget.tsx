"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/types/widget";
import { formatValue } from "@/lib/formatter";
import { normalizeApiResponse } from "@/lib/normalizeApiResponse";
import WidgetState from "./WidgetState";
import { cachedFetch } from "@/lib/apiCache";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from "lucide-react";

type Props = {
  widget: WidgetConfig;
};

export default function TableWidget({ widget }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<
    Record<string, string>
  >({});
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const tickerField = widget.card?.tickerField ?? "ticker";

  function getValue(row: any, field: string) {
    return field
      .split(".")
      .reduce((acc: any, k) => acc?.[k], row.raw ?? row);
  }

  function toggleSort(field: string) {
    if (sortBy !== field) {
      setSortBy(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortBy(null);
      setSortDir("asc");
    }
  }

  const getTicker = (row: any) =>
    tickerField
      .split(".")
      .reduce((acc: any, k) => acc?.[k], row);

  const getCompany = (row: any) =>
    row.company ?? row.name ?? getTicker(row);

  const filteredData = data.filter((row) => {
    const matchesSearch =
      getCompany(row).toLowerCase().includes(search.toLowerCase()) ||
      getTicker(row).toLowerCase().includes(search.toLowerCase()) ||
      widget.fields?.some((field) => {
        const value = getValue(row, field);

        return String(value ?? "")
          .toLowerCase()
          .includes(search.toLowerCase());
      });

    if (!matchesSearch) return false;

    return widget.fields?.every((field) => {
      const filterValue = columnFilters[field];
      if (!filterValue) return true;

      const value = getValue(row, field);

      if (typeof value === "number") {
        return value >= Number(filterValue);
      }

      return String(value ?? "")
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    });
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortBy) return 0;

    const aVal = getValue(a, sortBy);
    const bVal = getValue(b, sortBy);

    if (aVal == null) return 1;
    if (bVal == null) return -1;

    const aNum = Number(aVal);
    const bNum = Number(bVal);

    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    }

    return sortDir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);

  const paginatedData = sortedData.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );


  async function fetchData() {
    if (!widget.api?.url) return;

    try {
      setLoading(true);
      setError(null);

      const json = await cachedFetch(
        widget.api.url,
        (widget.api?.refreshInterval ?? 30) * 1000
      );

      const normalized = normalizeApiResponse(widget.api.url, json);
      setData(normalized.rows);
      setPage(0);
    } catch (err: any) {
      if (err.message === "HTTP_429") {
        setError("Rate limit reached. Retrying shortly.");
      } else {
        setError("Failed to load data.");
      }
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(
      fetchData,
      (widget.api?.refreshInterval ?? 30) * 1000
    );

    return () => clearInterval(interval);
  }, [widget.api?.url, widget.api?.refreshInterval]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [sortBy, sortDir]);


  return (
    <WidgetState
      loading={loading}
      error={error}
      empty={!data || data.length === 0}
      lastUpdated={lastRefreshed}
    >
      <div className="relative h-full flex flex-col overflow-hidden space-y-3">
        {/* Search Bar */}
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary/70" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies or tickers..."
            className="w-full bg-muted/30 border border-border/50 rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-sm"
          />
        </div>

        <div className="flex-1 overflow-auto rounded-xl border border-border/50 relative bg-background/50 shadow-inner custom-scrollbar">
          <table className="w-full text-sm border-collapse text-left">
            {/* Header */}
            <thead className="sticky top-0 z-30 bg-muted/90 backdrop-blur-md shadow-sm">
              <tr>
                {/* Company */}
                <th className="px-4 py-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider sticky left-0 z-40 bg-muted/95 backdrop-blur-md border-b border-border/50 border-r border-border/30">
                  Company
                </th>

                {/* Ticker */}
                <th className="px-4 py-3 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border/50">
                  Ticker
                </th>

                {/* Metrics */}
                {widget.fields?.map((field) => {
                  const isActive = sortBy === field;
                  const isFiltering = activeFilter === field;
                  const hasFilter = !!columnFilters[field];

                  return (
                    <th
                      key={field}
                      className="px-4 py-2 font-semibold text-muted-foreground text-[11px] uppercase tracking-wider border-b border-border/50 min-w-[140px]"
                    >
                      {isFiltering ? (
                        <div className="flex items-center gap-1 bg-background rounded-md border border-primary/20 px-1.5 py-0.5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                          <input
                            autoFocus
                            className="w-full bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/50 h-6 min-w-0"
                            placeholder="Filter..."
                            value={columnFilters[field] || ""}
                            onChange={(e) =>
                              setColumnFilters((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") {
                                setActiveFilter(null);
                              }
                            }}
                            onBlur={() => {
                              // Optional: close on blur if empty
                              // setActiveFilter(null);
                            }}
                          />
                          <button
                            onClick={() => setActiveFilter(null)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group/header gap-2">
                          <div
                            className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors select-none flex-1 truncate"
                            onClick={() => toggleSort(field)}
                          >
                            <span className="truncate" title={field.split(".").pop()?.replace(/_/g, " ")}>
                              {field.split(".").pop()?.replace(/_/g, " ")}
                            </span>
                            <span className={`transition-all duration-200 ${isActive ? "text-primary scale-110" : "text-muted-foreground/30 opacity-0 group-hover/header:opacity-100 group-hover/header:text-muted-foreground/60"}`}>
                              {isActive ? (
                                sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                              ) : (
                                <ArrowUpDown size={12} />
                              )}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilter(field);
                            }}
                            className={`p-1 rounded hover:bg-background/80 transition-all ${hasFilter
                                ? "text-primary bg-primary/10 opacity-100"
                                : "text-muted-foreground/40 opacity-0 group-hover/header:opacity-100 hover:text-foreground"
                              }`}
                          >
                            <Filter size={12} fill={hasFilter ? "currentColor" : "none"} />
                          </button>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-border/30">
              {paginatedData.map((row, idx) => (
                <tr
                  key={getTicker(row) ?? idx}
                  className="group hover:bg-muted/40 transition-colors"
                >
                  {/* Company (sticky) */}
                  <td className="sticky left-0 z-20 bg-background/95 backdrop-blur-sm group-hover:bg-muted/90 px-4 py-3 max-w-[180px] font-medium text-foreground transition-colors border-r border-border/30 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                    <div className="truncate" title={getCompany(row)}>
                      {getCompany(row)}
                    </div>
                  </td>

                  {/* Ticker */}
                  <td className="px-4 py-3 font-mono text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">
                    {getTicker(row)}
                  </td>

                  {/* Metrics */}
                  {widget.fields?.map((field) => {
                    const value = getValue(row, field);
                    const isNumber = typeof value === "number";

                    return (
                      <td
                        key={field}
                        className={`px-4 py-3 ${isNumber ? "tabular-nums tracking-tight" : ""} text-foreground/80 group-hover:text-foreground transition-colors`}
                      >
                        {formatValue(value, widget.fieldFormats?.[field])}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-1 px-1">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
            Showing <span className="text-foreground">{page * PAGE_SIZE + 1}</span> - <span className="text-foreground">{Math.min((page + 1) * PAGE_SIZE, sortedData.length)}</span> of <span className="text-foreground">{sortedData.length}</span>
          </p>

          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/30">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background shadow-none hover:shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex items-center gap-0.5 px-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i;
                if (totalPages > 5) {
                  if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-6 min-w-[24px] px-1 rounded-md text-[10px] font-semibold transition-all ${page === pageNum
                      ? "bg-background text-primary shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background shadow-none hover:shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </WidgetState>
  );
}
