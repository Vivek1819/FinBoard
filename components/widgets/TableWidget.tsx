"use client";

import { useEffect, useState } from "react";
import type { WidgetConfig } from "@/types/widget";
import { normalizeApiResponse } from "@/lib/normalizeApiResponse";
import WidgetState from "./WidgetState";

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
      setSortBy(null); // clear sort
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
    // Global search
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

    // ✅ numeric sort if both are valid numbers
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    }

    // 🔁 fallback to string sort
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

      const normalized = normalizeApiResponse(widget.api.url, json);
      setData(normalized.rows);
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


  return (
    <WidgetState
      loading={loading}
      error={error}
      empty={!data || data.length === 0}
    >
      <div className="relative h-full rounded-lg border border-border flex flex-col">
        <div className="px-3 py-2 border-b border-border bg-card">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-md bg-background border border-border px-2 py-1 text-sm"
          />
        </div>

        <div className="flex-1 overflow-auto relative">
          <table className="min-w-max text-sm border-collapse">
            {/* Header */}
            <thead className="sticky top-0 z-30 bg-card border-b border-border">
              {/* Column titles */}
              <tr>
                {/* Company */}
                <th className="sticky left-0 top-0 z-40 bg-card px-3 py-2">
                  Company
                </th>

                {/* Ticker */}
                <th className="px-3 py-2 text-left text-xs font-medium uppercase">
                  Ticker
                </th>

                {/* Metrics */}
                {widget.fields?.map((field) => {
                  const isActive = sortBy === field;
                  return (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      className="px-3 py-2 text-left text-xs font-medium uppercase cursor-pointer"
                    >
                      {field.split(".").pop()}
                      {isActive && (sortDir === "asc" ? " ↑" : " ↓")}
                    </th>
                  );
                })}
              </tr>

              {/* Column filters */}
              <tr className="border-t border-border">
                <th className="sticky left-0 top-0 z-30 bg-card px-2 py-1" />
                <th className="px-2 py-1" />

                {widget.fields?.map((field) => {
                  const sampleValue = field
                    .split(".")
                    .reduce((acc: any, key) => acc?.[key], data[0]?.raw);

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
                  key={getTicker(row) ?? idx}
                  className="odd:bg-background even:bg-background/50 hover:bg-emerald-500/5"
                >
                  {/* Company (sticky) */}
                  <td className="sticky left-0 z-20 bg-background px-3 py-2 max-w-[220px] truncate">
                    {getCompany(row)}
                  </td>

                  {/* Ticker */}
                  <td className="px-3 py-2 font-mono">
                    {getTicker(row)}
                  </td>

                  {/* Metrics */}
                  {widget.fields?.map((field) => {
                    const value = getValue(row, field);

                    const isNumber = typeof value === "number";

                    return (
                      <td
                        key={field}
                        className={`px-3 py-2 ${isNumber ? "text-right tabular-nums" : ""
                          }`}
                      >
                        {value ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

          </table>
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
    </WidgetState>
  );
}
