"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { Card, Badge, PageHeader, Loading, Empty, inputClass } from "../../components/ui";
import MapView, { type MapMarker } from "../../components/MapView";
import type { Category, Provider } from "../../lib/types";

const HARARE = { lat: -17.8252, lng: 31.0335 };

export default function BrowsePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [category, setCategory] = useState<string>();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("rating");
  const [verified, setVerified] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories().then((c) => setCategories(c.categories));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { providers } = await api.providers({ category, q: q || undefined, sort, verified });
    setProviders(providers);
    setLoading(false);
  }, [category, q, sort, verified]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <>
      <PageHeader title="Browse providers" subtitle="Verified pros across Harare." />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} className={inputClass} placeholder="Search services or workers…" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${inputClass} sm:w-48`}>
          <option value="rating">Top rated</option>
          <option value="price">Lowest price</option>
          <option value="distance">Nearest</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setCategory(undefined)} className={chip(!category)}>All</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.slug)} className={chip(category === c.slug)}>{c.name}</button>
        ))}
        <button onClick={() => setVerified((v) => !v)} className={chip(verified)}>Verified only</button>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setView("list")} className={chip(view === "list")}>List</button>
          <button onClick={() => setView("map")} className={chip(view === "map")}>Map</button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : providers.length === 0 ? (
        <Empty>No providers match your filters.</Empty>
      ) : view === "map" ? (
        <MapView
          height={480}
          center={(() => {
            const g = providers.find((p) => p.lat != null && p.lng != null);
            return g ? { lat: Number(g.lat), lng: Number(g.lng) } : HARARE;
          })()}
          markers={providers
            .filter((p) => p.lat != null && p.lng != null)
            .map<MapMarker>((p) => ({
              id: p.id,
              lat: Number(p.lat),
              lng: Number(p.lng),
              title: `${p.full_name} · $${p.hourly_rate ?? "-"}/hr`,
              onClick: () => router.push(`/providers/${p.id}`),
            }))}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => (
            <Link key={p.id} href={`/providers/${p.id}`}>
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-pj-slate-900 flex items-center gap-1">
                      {p.full_name}
                      {p.id_verified && <span className="text-pj-blue-600">✓</span>}
                    </div>
                    <div className="text-sm text-pj-slate-500">{p.headline?.split("·")[0] ?? p.primary_category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-pj-slate-900">${p.hourly_rate}</div>
                    <div className="text-xs text-pj-slate-400">/hr</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm font-semibold text-amber-500">★ {p.rating ?? "—"}</span>
                  <span className="text-sm text-pj-slate-400">({p.reviews_count})</span>
                  {p.is_pro && <Badge color="green">Pro</Badge>}
                  {p.is_top_rated && <Badge color="amber">Top</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function chip(active: boolean) {
  return `rounded-full px-4 py-1.5 text-sm font-medium border transition ${active ? "bg-pj-blue-600 border-pj-blue-600 text-white" : "bg-white border-pj-slate-200 text-pj-slate-600 hover:border-pj-slate-300"}`;
}
