"use client";

import { useMemo, useState } from "react";
import ItemCard from "./ItemCard";
import SeedButton from "./SeedButton";
import AccessForm from "./AccessForm";
import { AccessError, generateProfile } from "@/lib/analysis";
import { useItems } from "@/lib/useItems";
import { useProfile } from "@/lib/useProfile";
import type { Cluster, Item } from "@/lib/types";

const MIN_ITEMS = 3;

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat("es", { day: "numeric", month: "long" }).format(ts);

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function ProfileView() {
  const items = useItems();
  const profile = useProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsCode, setNeedsCode] = useState(false);

  const clusters = useMemo(
    () => [...(profile?.clusters ?? [])].sort((a, b) => b.weight - a.weight),
    [profile],
  );
  const byId = useMemo(() => new Map(clusters.map((c) => [c.id, c])), [clusters]);
  const itemsById = useMemo(() => new Map((items ?? []).map((i) => [i.id, i])), [items]);

  if (items === null || profile === undefined) return null;

  async function generate() {
    setBusy(true);
    setError("");
    try {
      await generateProfile();
      setSelectedId(null);
      setNeedsCode(false);
    } catch (e) {
      if (e instanceof AccessError) {
        setNeedsCode(true);
        return;
      }
      setError(e instanceof Error ? e.message : "No se pudo generar el perfil.");
    } finally {
      setBusy(false);
    }
  }

  if (items.length < MIN_ITEMS) {
    return (
      <div className="empty">
        <p>Para dibujar un perfil hacen falta al menos {MIN_ITEMS} elementos guardados.</p>
        <p>Comparte contenido desde otras apps, o carga unos datos de ejemplo.</p>
        <div style={{ marginTop: 24 }}><SeedButton primary /></div>
      </div>
    );
  }

  const selected = selectedId ? byId.get(selectedId) : undefined;
  if (selected) {
    return (
      <ClusterDetail
        cluster={selected}
        total={items.length}
        items={selected.itemIds.flatMap((id) => itemsById.get(id) ?? [])}
        linked={selected.links.flatMap((l) => {
          const to = byId.get(l.to);
          return to ? [{ cluster: to, reason: l.reason }] : [];
        })}
        onBack={() => setSelectedId(null)}
        onSelect={setSelectedId}
      />
    );
  }

  const newer = profile ? items.filter((i) => i.savedAt > profile.generatedAt).length : 0;

  return (
    <>
      <div className="profile-bar">
        {profile && (
          <p className="meta">
            Generado el {formatDate(profile.generatedAt)}
            {newer > 0 && ` · ${plural(newer, "elemento nuevo", "elementos nuevos")} desde entonces`}
          </p>
        )}
        <button className="btn btn-primary" onClick={generate} disabled={busy}>
          {busy ? "Generando perfil" : profile ? "Actualizar perfil" : "Generar perfil"}
        </button>
        {busy && <p className="meta">Esto puede tardar unos segundos.</p>}
        {needsCode && !busy && <AccessForm onDone={generate} />}
        {error && <p className="error" role="alert">{error}</p>}
      </div>

      {!profile ? (
        <div className="empty">
          <p>Todavía no hay perfil.</p>
          <p>Se analizan tus {items.length} elementos y se agrupan en torno a los intereses que más se repiten.</p>
        </div>
      ) : (
        <div className="cloud" role="list">
          {clusters.map((c) => (
            <button
              key={c.id}
              role="listitem"
              className="bubble"
              style={{ fontSize: `${Math.round(17 + c.weight * 21)}px` }}
              onClick={() => setSelectedId(c.id)}
            >
              <span className="bubble-name">{c.name}</span>
              <span className="meta bubble-count">{c.itemIds.length}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function ClusterDetail({
  cluster, total, items, linked, onBack, onSelect,
}: {
  cluster: Cluster;
  total: number;
  items: Item[];
  linked: { cluster: Cluster; reason: string }[];
  onBack: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <article>
      <button className="link back" onClick={onBack}>Todos los grupos</button>
      <h2 className="page-title" style={{ marginTop: 16 }}>{cluster.name}</h2>
      <p className="meta" style={{ marginTop: 8 }}>
        {plural(items.length, "elemento", "elementos")} de {total} · peso {Math.round(cluster.weight * 100)} %
      </p>
      <p className="detail-summary">{cluster.summary}</p>

      {linked.length > 0 && (
        <section className="section">
          <h3 className="section-title">Conexiones</h3>
          <div className="stack" style={{ marginTop: 16 }}>
            {linked.map(({ cluster: c, reason }) => (
              <button key={c.id} className="card link-card" onClick={() => onSelect(c.id)}>
                <span className="item-title">{c.name}</span>
                <span className="item-body">{reason}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h3 className="section-title">Elementos</h3>
        <div className="stack" style={{ marginTop: 16 }}>
          {items.map((i) => <ItemCard key={i.id} item={i} />)}
        </div>
      </section>
    </article>
  );
}
