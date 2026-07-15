"use client";

import { useMemo, useState } from "react";
import type { Category } from "../lib/types";
import { inputClass } from "./ui";

/**
 * Searchable, sector-grouped single-select for the 70 service categories.
 *
 * Replaces the flat wall of chips: type to filter across all categories, or scan by sector.
 * `value` is the selected slug (or undefined). `onChange(slug | undefined)` — selecting the
 * active category again clears it. Set `includeAll` to render an "All categories" reset row
 * (used by the browse filter, where "no category" is a meaningful state).
 */
export default function CategoryPicker({
  categories,
  value,
  onChange,
  includeAll = false,
  allLabel = "All categories",
  placeholder = "Search services…",
}: {
  categories: Category[];
  value?: string;
  onChange: (slug: string | undefined) => void;
  includeAll?: boolean;
  allLabel?: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");

  // Group by sector, preserving the API's sort order within each group.
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const bySector = new Map<string, Category[]>();
    for (const c of categories) {
      if (needle && !c.name.toLowerCase().includes(needle) && !(c.sector ?? "").toLowerCase().includes(needle)) {
        continue;
      }
      const key = c.sector ?? "Other";
      if (!bySector.has(key)) bySector.set(key, []);
      bySector.get(key)!.push(c);
    }
    return Array.from(bySector, ([sector, items]) => ({ sector, items }));
  }, [categories, q]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const selectedName = value ? categories.find((c) => c.slug === value)?.name : undefined;

  return (
    <div>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={inputClass}
          placeholder={placeholder}
          aria-label="Search categories"
        />
        {selectedName && !q && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-pj-blue-50 px-3 py-1 text-xs font-semibold text-pj-blue-700">
            {selectedName}
          </span>
        )}
      </div>

      <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-pj-slate-200 p-2">
        {includeAll && !q && (
          <button
            type="button"
            aria-pressed={!value}
            onClick={() => onChange(undefined)}
            className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
              !value ? "bg-pj-blue-600 text-white" : "text-pj-slate-600 hover:bg-pj-slate-50"
            }`}
          >
            {allLabel}
          </button>
        )}

        {total === 0 ? (
          // Distinguish "still loading" (no categories yet, no query) from a real empty search.
          <div className="px-3 py-6 text-center text-sm text-pj-slate-500">
            {q.trim() ? `No categories match “${q}”.` : categories.length === 0 ? "Loading…" : ""}
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.sector} className="mb-2 last:mb-0">
              <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-pj-slate-400">
                {g.sector}
              </div>
              <div className="flex flex-wrap gap-1.5 px-1">
                {g.items.map((c) => {
                  const active = value === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChange(active ? undefined : c.slug)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium border transition ${
                        active
                          ? "bg-pj-blue-600 border-pj-blue-600 text-white"
                          : "bg-white border-pj-slate-200 text-pj-slate-600 hover:border-pj-blue-300 hover:text-pj-blue-600"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
