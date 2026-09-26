"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import type { Analytics } from "./types";

type Person = Analytics["recentUsers"][number];
type SortKey = "created_at" | "completed_interviews" | "current_streak" | "readiness";

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "created_at", label: "Joined", numeric: false },
  { key: "completed_interviews", label: "Interviews", numeric: true },
  { key: "current_streak", label: "Streak", numeric: true },
  { key: "readiness", label: "Readiness", numeric: true },
];

type Filter = "all" | "stalled" | "unconfirmed";

/**
 * The people list, with the two questions you actually open it to answer
 * pulled out as filters.
 *
 * "Stalled" — registered but never finished an interview — is the group worth
 * emailing, and finding them by reading down a table of 25 is exactly the kind
 * of work a dashboard should have already done for you.
 */
export function PeopleTable({ people }: { people: Person[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("created_at");
  const [descending, setDescending] = useState(true);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = people.filter((person) => {
      if (filter === "stalled" && person.completed_interviews > 0) return false;
      if (filter === "unconfirmed" && person.verified) return false;
      if (!needle) return true;
      return (
        person.email.toLowerCase().includes(needle) ||
        (person.display_name ?? "").toLowerCase().includes(needle)
      );
    });

    return [...filtered].sort((a, b) => {
      const left = a[sort];
      const right = b[sort];
      const compared =
        sort === "created_at"
          ? String(left).localeCompare(String(right))
          : Number(left) - Number(right);
      return descending ? -compared : compared;
    });
  }, [people, query, filter, sort, descending]);

  function toggleSort(key: SortKey) {
    if (key === sort) setDescending((d) => !d);
    else {
      setSort(key);
      setDescending(true);
    }
  }

  const stalled = people.filter((p) => p.completed_interviews === 0).length;
  const unconfirmed = people.filter((p) => !p.verified).length;

  const FILTERS: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Everyone", count: people.length },
    { value: "stalled", label: "Never finished one", count: stalled },
    { value: "unconfirmed", label: "Unconfirmed email", count: unconfirmed },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--border)] p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand-bright)]"
          />
        </div>

        <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={[
                "rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-semibold transition-colors",
                filter === item.value
                  ? "bg-[var(--surface)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]",
              ].join(" ")}
            >
              {item.label}
              <span className="ml-2 text-[var(--text-faint)]">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--text-faint)]">
            {people.length === 0 ? "No accounts yet." : "Nobody matches that."}
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--surface-2)]">
              <tr className="text-left text-[var(--text-faint)]">
                <th className="px-4 py-2.5 font-semibold">Person</th>
                <th className="px-4 py-2.5 font-semibold">Field</th>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-2.5 font-semibold ${column.numeric ? "text-right" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`inline-flex items-center gap-1 transition-colors hover:text-[var(--text)] ${
                        sort === column.key ? "text-[var(--text)]" : ""
                      }`}
                    >
                      {column.label}
                      {sort === column.key ? (
                        descending ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUp className="size-3" />
                        )
                      ) : null}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((person) => (
                <tr
                  key={person.email}
                  className="border-t border-[var(--border)]"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-medium">
                      {person.display_name?.trim() || person.email}
                    </span>
                    {person.display_name?.trim() ? (
                      <span className="ml-2 text-xs text-[var(--text-faint)]">
                        {person.email}
                      </span>
                    ) : null}
                    {!person.verified ? (
                      <span className="ml-2 rounded-full bg-[var(--warn-dim)] px-2 py-0.5 text-[10px] font-bold text-[var(--warn)]">
                        UNCONFIRMED
                      </span>
                    ) : null}
                    {!person.onboarded ? (
                      <span className="ml-2 rounded-full bg-[var(--warn-dim)] px-2 py-0.5 text-[10px] font-bold text-[var(--warn)]">
                        NO ONBOARDING
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 capitalize text-[var(--text-muted)]">
                    {person.field?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">
                    {new Date(person.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {person.completed_interviews}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {person.current_streak}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {person.readiness}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="shrink-0 border-t border-[var(--border)] px-4 py-2.5 text-xs text-[var(--text-faint)]">
        Showing {rows.length} of the {people.length} most recent accounts.
      </p>
    </div>
  );
}
