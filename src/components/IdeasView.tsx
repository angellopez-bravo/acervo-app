"use client";

import Link from "next/link";
import { useMemo } from "react";
import { setIdeaStatus, useIdeas } from "@/lib/useIdeas";
import { useProfile } from "@/lib/useProfile";
import type { Idea } from "@/lib/types";

const KIND_LABEL: Record<Idea["kind"], string> = { contenido: "Contenido", proyecto: "Proyecto" };

export default function IdeasView() {
  const ideas = useIdeas();
  const profile = useProfile();
  const names = useMemo(() => new Map((profile?.clusters ?? []).map((c) => [c.id, c.name])), [profile]);

  if (ideas === null || profile === undefined) return null;

  if (ideas.length === 0) {
    return (
      <div className="empty">
        <p>Todavía no hay ideas.</p>
        <p>Salen del perfil: cruzan varios de tus grupos de intereses y proponen contenido o proyectos.</p>
        <div style={{ marginTop: 24 }}>
          <Link href="/perfil" className="btn btn-primary">Ir al perfil</Link>
        </div>
      </div>
    );
  }

  const pending = ideas.filter((i) => i.status === "nueva");
  const liked = ideas.filter((i) => i.status === "interesa");
  const dismissed = ideas.filter((i) => i.status === "descartada");

  const card = (idea: Idea, actions: React.ReactNode) => {
    const clusters = idea.clusterIds.flatMap((id) => names.get(id) ?? []);
    return (
      <article key={idea.id} className="card idea">
        <p className="label">{KIND_LABEL[idea.kind]}</p>
        <h3 className="idea-title">{idea.title}</h3>
        <p className="idea-why">{idea.why}</p>
        {clusters.length > 0 && <p className="meta">{clusters.join(" · ")}</p>}
        <div className="idea-actions">{actions}</div>
      </article>
    );
  };

  return (
    <>
      {pending.length > 0 ? (
        <div className="stack">
          {pending.map((idea) =>
            card(
              idea,
              <>
                <button className="btn btn-primary" onClick={() => setIdeaStatus(idea, "interesa")}>Me interesa</button>
                <button className="btn" onClick={() => setIdeaStatus(idea, "descartada")}>Descartar</button>
              </>,
            ),
          )}
        </div>
      ) : (
        <div className="empty" style={{ marginTop: 0 }}>
          <p>No quedan ideas nuevas.</p>
          <p>
            Guarda más contenido y <Link href="/perfil" className="link">actualiza el perfil</Link> para recibir otras.
          </p>
        </div>
      )}

      {liked.length > 0 && (
        <section className="section">
          <h2 className="section-title">Te interesan</h2>
          <div className="stack" style={{ marginTop: 16 }}>
            {liked.map((idea) =>
              card(idea, <button className="btn" onClick={() => setIdeaStatus(idea, "nueva")}>Quitar de mis intereses</button>),
            )}
          </div>
        </section>
      )}

      {dismissed.length > 0 && (
        <details className="section dismissed">
          <summary className="section-title">Descartadas ({dismissed.length})</summary>
          <div className="stack" style={{ marginTop: 16 }}>
            {dismissed.map((idea) =>
              card(idea, <button className="btn" onClick={() => setIdeaStatus(idea, "nueva")}>Recuperar</button>),
            )}
          </div>
        </details>
      )}
    </>
  );
}
