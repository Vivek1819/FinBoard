"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/types/widget";

type Props = {
  widget: WidgetConfig;
};

export default function TableWidget({ widget }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<
    Record<string, string>
  >({});
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(0);

  function toggleSort(field: string) {
    if (sortBy !== field) {
      setSortBy(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortBy(null); // clear sort
      setSortDir("asc");
    }
  }

  const filteredData = data.filter((row) => {
    // Global search
    const matchesSearch = widget.fields?.some((field) => {
      const value = field
        .split(".")
        .reduce((acc: any, key) => acc?.[key], row);

      return String(value ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
    });

    if (!matchesSearch) return false;

    return widget.fields?.every((field) => {
      const filterValue = columnFilters[field];
      if (!filterValue) return true;

      const value = field
        .split(".")
        .reduce((acc: any, key) => acc?.[key], row);

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

    const aVal = sortBy
      .split(".")
      .reduce((acc: any, key) => acc?.[key], a);

    const bVal = sortBy
      .split(".")
      .reduce((acc: any, key) => acc?.[key], b);

    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
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

      const res = await fetch(widget.api.url);

      if (res.status === 429) {
        throw new Error("RATE_LIMIT");
      }

      if (!res.ok) {
        throw new Error(`HTTP_${res.status}`);
      }

      const json = await res.json();

      const rows = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
          ? json.data
          : [];

      setData(rows);
      setPage(0);
    } catch (err: any) {
      if (err.message === "RATE_LIMIT") {
        setError("Rate limit reached. Retrying shortly.");
      } else {
        setError("Failed to load data.");
      }
    } finally {
      setLoading(false);
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


  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted">
        Loading data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-yellow-400">
        {error}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted">
        No data available
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-lg border border-border flex flex-col">
      <div className="px-3 py-2 border-b border-border bg-card">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-md bg-background border border-border px-2 py-1 text-sm"
        />
      </div>

      <div className="flex-1 overflow-x-auto">
         <div className="min-w-max max-h-full overflow-y-auto">
          <table className="min-w-max text-sm">
            {/* Header */}
            <thead className="sticky top-0 z-10 bg-card border-b border-border">
              {/* Column titles */}
              <tr>
                {widget.fields?.map((field) => {
                  const isActive = sortBy === field;

                  return (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      className="px-3 py-2 text-left font-medium uppercase text-xs tracking-wide
                   cursor-pointer select-none hover:text-foreground"
                    >
                      <div className="flex items-center gap-1">
                        <span>{field.split(".").pop()}</span>
                        {isActive && (
                          <span className="text-xs">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>


              {/* Column filters */}
              <tr className="border-t border-border">
                {widget.fields?.map((field) => {
                  const sampleValue = data[0]
                    ?.split?.(".")
                    ? null
                    : field
                      .split(".")
                      .reduce((acc: any, key) => acc?.[key], data[0]);

                  const isNumber = typeof sampleValue === "number";

                  return (
                    <th key={field} className="px-2 py-1">
                      <input
                        type={isNumber ? "number" : "text"}
                        placeholder={isNumber ? "Min" : "Filter"}
                        value={columnFilters[field] ?? ""}
                        onChange={(e) =>
                          setColumnFilters((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                        className="w-full rounded-sm bg-background border border-border px-1 py-0.5 text-xs"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>


            {/* Body */}
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className="odd:bg-background even:bg-background/50 hover:bg-emerald-500/5 transition"
                >
                  {widget.fields?.map((field) => {
                    const value = field
                      .split(".")
                      .reduce((acc: any, key) => acc?.[key], row);

                    const isNumber = typeof value === "number";

                    return (
                      <td
                        key={field}
                        className={`px-3 py-2 ${isNumber ? "text-right tabular-nums" : ""
                          }`}
                      >
                        {value !== undefined
                          ? isNumber
                            ? value.toLocaleString()
                            : String(value)
                          : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-card">
          <span className="text-xs text-muted">
            Page {page + 1} of {totalPages || 1}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="px-2 py-1 text-xs rounded-md border border-border disabled:opacity-40"
            >
              Prev
            </button>

            <button
              onClick={() =>
                setPage((p) => Math.min(p + 1, totalPages - 1))
              }
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-xs rounded-md border border-border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
