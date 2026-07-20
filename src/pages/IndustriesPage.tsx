import { useMemo, useState } from "react";
import { CATEGORIES, INDUSTRIES } from "../data/catalog";
import { IndustryCard } from "../components/catalog/IndustryCard";
import { SearchInput } from "../components/common/SearchInput";
import { EmptyState } from "../components/common/EmptyState";

export function IndustriesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [withDemosOnly, setWithDemosOnly] = useState(false);
  const [sortAZ, setSortAZ] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = INDUSTRIES.filter((i) => {
      const matchesSearch =
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.examples.some((e) => e.toLowerCase().includes(q)) ||
        i.services.some((s) => s.name.toLowerCase().includes(q));
      const matchesCategory = !category || i.category === category;
      const matchesPriority = !priorityOnly || i.priority;
      const matchesDemos =
        !withDemosOnly || i.services.some((s) => s.demoStatus === "available");
      return matchesSearch && matchesCategory && matchesPriority && matchesDemos;
    });
    if (sortAZ) list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [search, category, priorityOnly, withDemosOnly, sortAZ]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Industry Catalog</h1>
        <p className="text-sm text-slate-500">
          {INDUSTRIES.length} industries · {INDUSTRIES.reduce((n, i) => n + i.services.length, 0)} service offers
        </p>
      </header>

      <SearchInput value={search} onChange={setSearch} placeholder="Search industries, examples, or services…" />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <FilterChip active={priorityOnly} onClick={() => setPriorityOnly((v) => !v)}>
          Priority markets
        </FilterChip>
        <FilterChip active={withDemosOnly} onClick={() => setWithDemosOnly((v) => !v)}>
          With demos
        </FilterChip>
        <FilterChip active={sortAZ} onClick={() => setSortAZ((v) => !v)}>
          Sort A–Z
        </FilterChip>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="Building2"
          title="No industries match"
          message="Try a different search term or clear the filters."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <IndustryCard key={i.id} industry={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-xl px-3.5 text-sm font-medium transition ${
        active ? "bg-accent text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
