"use client";

import { useMemo, useState } from "react";
import ItemCard from "./ItemCard";
import SeedButton from "./SeedButton";
import { SOURCE_LABEL } from "@/lib/source";
import { getLoadedAt, useItems } from "@/lib/useItems";
import type { SourceApp } from "@/lib/types";

const DAY = 86_400_000;
const RANGES = [
  { id: "todo", label: "Todo", test: () => true },
  { id: "7", label: "7 días", test: (age: number) => age <= 7 * DAY },
  { id: "30", label: "30 días", test: (age: number) => age <= 30 * DAY },
  { id: "antiguo", label: "Más antiguo", test: (age: number) => age > 30 * DAY },
];

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="filter-row" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} className="chip" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Library() {
  const items = useItems();
  const now = getLoadedAt();
  const [query, setQuery] = useState("");
  const [app, setApp] = useState<SourceApp | "todas">("todas");
  const [topic, setTopic] = useState("todos");
  const [range, setRange] = useState("todo");

  const topics = useMemo(() => {
    const count = new Map<string, number>();
    items?.forEach((i) => i.analysis?.topics.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t).slice(0, 14);
  }, [items]);

  const apps = useMemo(() => [...new Set(items?.map((i) => i.source))] as SourceApp[], [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = norm(query.trim());
    const inRange = RANGES.find((r) => r.id === range)!.test;
    return items.filter((i) => {
      if (app !== "todas" && i.source !== app) return false;
      if (topic !== "todos" && !i.analysis?.topics.includes(topic)) return false;
      if (!inRange(now - i.savedAt)) return false;
      if (!q) return true;
      return norm([i.title, i.text, i.url, ...(i.analysis?.topics ?? [])].join(" ")).includes(q);
    });
  }, [items, query, app, topic, range, now]);

  if (items === null) return null;

  if (items.length === 0) {
    return (
      <div className="empty">
        <p>La biblioteca está vacía.</p>
        <p>Comparte contenido desde otras apps, o carga unos datos de ejemplo para ver cómo queda.</p>
        <div style={{ marginTop: 24 }}>
          <SeedButton primary />
        </div>
      </div>
    );
  }

  const filtering = query || app !== "todas" || topic !== "todos" || range !== "todo";
  const reset = () => {
    setQuery("");
    setApp("todas");
    setTopic("todos");
    setRange("todo");
  };

  return (
    <>
      <input
        className="search"
        type="search"
        placeholder="Buscar por título, texto o tema"
        aria-label="Buscar"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="filters">
        <Chips
          label="Aplicación"
          value={app}
          onChange={setApp}
          options={[{ id: "todas", label: "Todas" }, ...apps.map((a) => ({ id: a, label: SOURCE_LABEL[a] }))]}
        />
        {topics.length > 0 && (
          <Chips
            label="Tema"
            value={topic}
            onChange={setTopic}
            options={[{ id: "todos", label: "Todos los temas" }, ...topics.map((t) => ({ id: t, label: t }))]}
          />
        )}
        <Chips label="Fecha" value={range} onChange={setRange} options={RANGES.map(({ id, label }) => ({ id, label }))} />
      </div>

      <p className="meta" style={{ margin: "20px 0 12px" }}>
        {filtered.length} de {items.length} elementos
        {filtering && (
          <>
            {" · "}
            <button className="link" onClick={reset}>Quitar filtros</button>
          </>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="empty" style={{ marginTop: 32 }}>
          <p>Ningún elemento coincide con esa búsqueda.</p>
        </div>
      ) : (
        <div className="grid">
          {filtered.map((i) => (
            <ItemCard key={i.id} item={i} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <SeedButton />
      </div>
    </>
  );
}
