"use client";

import Link from "next/link";
import { useEffect } from "react";
import ItemCard from "./ItemCard";
import SeedButton from "./SeedButton";
import { catchUpPreviews } from "@/lib/analysis";
import { useItems } from "@/lib/useItems";
import { useProfile } from "@/lib/useProfile";

const RECENT = 5;
const MIN_FOR_PROFILE = 3;

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat("es", { day: "numeric", month: "long" }).format(ts);

export default function Home() {
  const items = useItems();
  const profile = useProfile();
  const loaded = items !== null;

  // Completa título, autor y miniatura de lo guardado antes de tener vista previa.
  useEffect(() => {
    if (loaded) catchUpPreviews().catch(() => {});
  }, [loaded]);

  if (items === null || profile === undefined) return null;

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

  const highlights = profile?.highlights ?? [];

  return (
    <>
      {highlights.length > 0 ? (
        <section className="section" style={{ marginTop: 32 }}>
          <h2 className="section-title">Destacado</h2>
          <p className="meta" style={{ marginTop: 4 }}>Según tu perfil del {formatDate(profile!.generatedAt)}</p>
          <div className="stack" style={{ marginTop: 16 }}>
            {highlights.map((h) => (
              <article key={h.title} className="card highlight">
                <h3 className="highlight-title">{h.title}</h3>
                <p className="highlight-body">{h.body}</p>
              </article>
            ))}
            <Link href="/perfil" className="link meta">Ver el perfil completo</Link>
          </div>
        </section>
      ) : (
        items.length >= MIN_FOR_PROFILE && (
          <section className="section" style={{ marginTop: 32 }}>
            <Link href="/perfil" className="card highlight">
              <h3 className="highlight-title">Genera tu perfil</h3>
              <p className="highlight-body">
                Con lo que has guardado se pueden dibujar tus grupos de intereses y proponerte ideas.
              </p>
            </Link>
          </section>
        )
      )}

      <section className="section">
        <h2 className="section-title">Guardado recientemente</h2>
        <div className="stack" style={{ marginTop: 16 }}>
          {items.slice(0, RECENT).map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
          {items.length > RECENT && (
            <Link href="/biblioteca" className="link meta">Ver toda la biblioteca ({items.length})</Link>
          )}
        </div>
      </section>
    </>
  );
}
