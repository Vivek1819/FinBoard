"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/types/widget";
import { normalizeApiResponse } from "@/lib/normalizeApiResponse";
import WidgetState from "./WidgetState";
import { cachedFetch } from "@/lib/apiCache";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(0);

  const tickerField = widget.card?.tickerField ?? "ticker";
  const resolveValue = (row: any, field: string) =>
    field.split(".").reduce((acc, k) => acc?.[k], row.raw ?? row);


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
      <div className="relative h-full flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="mb-3 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies or tickers..."
            className="w-full bg-muted/20 border border-border/40 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
          />
        </div>

        <div className="flex-1 overflow-auto rounded-xl border border-border/40 relative bg-card/30">
          <table className="w-full text-sm border-collapse text-left">
            {/* Header */}
            <thead className="sticky top-0 z-30 bg-card border-b border-border/50">
              <tr>
                {/* Company */}
                <th className="px-4 py-3.5 font-semibold text-foreground/80 text-xs uppercase tracking-wider sticky left-0 z-40 bg-card">
                  Company
                </th>

                {/* Ticker */}
                <th className="px-4 py-3.5 font-semibold text-foreground/80 text-xs uppercase tracking-wider">
                  Ticker
                </th>

                {/* Metrics */}
                {widget.fields?.map((field) => {
                  const isActive = sortBy === field;
                  return (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      className="px-4 py-3.5 font-semibold text-foreground/80 text-xs uppercase tracking-wider cursor-pointer hover:text-primary transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{field.split(".").pop()?.replace(/_/g, " ")}</span>
                        <span className={`transition-all ${isActive ? "text-primary" : "text-muted-foreground/30 group-hover:text-muted-foreground/60"}`}>
                          {isActive ? (
                            sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                          ) : (
                            <ArrowUpDown size={12} />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>


            {/* Body */}
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr
                  key={getTicker(row) ?? idx}
                  className="group border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {/* Company (sticky) */}
                  <td className="sticky left-0 z-20 bg-card/80 backdrop-blur-sm group-hover:bg-muted/30 px-4 py-3 max-w-[200px] truncate font-medium text-foreground transition-colors">
                    {getCompany(row)}
                  </td>

                  {/* Ticker */}
                  <td className="px-4 py-3 font-mono text-[11px] font-medium text-muted-foreground/70 group-hover:text-primary transition-colors uppercase tracking-wider">
                    {getTicker(row)}
                  </td>

                  {/* Metrics */}
                  {widget.fields?.map((field) => {
                    const value = getValue(row, field);
                    const isNumber = typeof value === "number";

                    return (
                      <td
                        key={field}
                        className={`px-4 py-3 ${isNumber ? "tabular-nums font-medium" : ""} text-foreground/70 group-hover:text-foreground transition-colors`}
                      >
                        {value ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground/60">
            Showing <span className="font-medium text-foreground">{page * PAGE_SIZE + 1}</span>-<span className="font-medium text-foreground">{Math.min((page + 1) * PAGE_SIZE, sortedData.length)}</span> of <span className="font-medium text-foreground">{sortedData.length}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-0.5 px-2">
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
                    className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${page === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </WidgetState>
  );
}
