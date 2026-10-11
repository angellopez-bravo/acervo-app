"use client";

import ItemCard from "./ItemCard";
import SeedButton from "./SeedButton";
import { useItems } from "@/lib/useItems";

export default function RecentItems() {
  const items = useItems();

  if (items === null) return null;

  if (items.length === 0) {
    return (
      <div className="empty">
        <p>Todavía no hay nada guardado.</p>
        <p>Desde Instagram, TikTok, X o YouTube, elige Compartir y después Acervo.</p>
        <div style={{ marginTop: 24 }}>
          <SeedButton />
        </div>
      </div>
    );
  }

  return (
    <section className="section">
      <h2 className="section-title">Guardado recientemente</h2>
      <div className="stack" style={{ marginTop: 16 }}>
        {items.slice(0, 6).map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
