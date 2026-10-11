"use client";

import { useMemo } from "react";
import type { Cluster } from "@/lib/types";

const W = 400;
const H = 470;
const CX = W / 2;
const CY = H / 2;
const RX = 118;
const RY = 178;

/** Parte el nombre en líneas cortas para que quepa dentro de la píldora. */
function wrap(name: string, max = 11): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of name.split(/\s+/)) {
    if (!current) current = word;
    else if ((current + " " + word).length <= max) current += " " + word;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

/** Coloca juntos los grupos que están conectados, empezando por el de más peso. */
function arrange(clusters: Cluster[]): Cluster[] {
  const pending = [...clusters].sort((a, b) => b.weight - a.weight);
  if (pending.length === 0) return [];
  const ordered = [pending.shift()!];
  while (pending.length) {
    const last = ordered[ordered.length - 1];
    const linked = pending.filter(
      (c) => last.links.some((l) => l.to === c.id) || c.links.some((l) => l.to === last.id),
    );
    const next = linked[0] ?? pending[0];
    pending.splice(pending.indexOf(next), 1);
    ordered.push(next);
  }
  return ordered;
}

type Node = { cluster: Cluster; x: number; y: number; w: number; h: number; fs: number; lines: string[] };

export default function MindMap({
  clusters, total, selectedId, onSelect,
}: {
  clusters: Cluster[];
  total: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const ordered = arrange(clusters);
    const n = ordered.length;
    const nodes: Node[] = ordered.map((cluster, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const fs = Math.round(14 + cluster.weight * 4);
      const lines = wrap(cluster.name);
      const widest = Math.max(...lines.map((l) => l.length));
      return {
        cluster,
        x: CX + (n === 1 ? 0 : RX * Math.cos(angle)),
        y: CY + (n === 1 ? -RY : RY * Math.sin(angle)),
        w: Math.round(widest * fs * 0.56 + 28),
        h: Math.round(lines.length * fs * 1.2 + 18),
        fs,
        lines,
      };
    });
    const at = new Map(nodes.map((nd) => [nd.cluster.id, nd]));
    const seen = new Set<string>();
    const edges: { a: Node; b: Node }[] = [];
    for (const nd of nodes) {
      for (const link of nd.cluster.links) {
        const other = at.get(link.to);
        const key = [nd.cluster.id, link.to].sort().join("|");
        if (other && !seen.has(key)) {
          seen.add(key);
          edges.push({ a: nd, b: other });
        }
      }
    }
    return { nodes, edges };
  }, [clusters]);

  const involved = (a: string, b: string) => selectedId !== null && (a === selectedId || b === selectedId);
  const related = new Set<string>(
    selectedId ? [selectedId, ...edges.flatMap((e) => (involved(e.a.cluster.id, e.b.cluster.id) ? [e.a.cluster.id, e.b.cluster.id] : []))] : [],
  );

  return (
    <svg className="mindmap" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Mapa mental de tus intereses">
      {nodes.map((nd) => (
        <line key={`c-${nd.cluster.id}`} className="mm-line" x1={CX} y1={CY} x2={nd.x} y2={nd.y} />
      ))}
      {edges.map(({ a, b }) => {
        const active = involved(a.cluster.id, b.cluster.id);
        return (
          <line
            key={`${a.cluster.id}-${b.cluster.id}`}
            className={`mm-link${active ? " active" : ""}`}
            style={{ opacity: selectedId && !active ? 0.25 : 1 }}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          />
        );
      })}

      <circle className="mm-center" cx={CX} cy={CY} r={26} />
      <text className="mm-total" x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle">{total}</text>

      {nodes.map((nd) => {
        const { cluster: c } = nd;
        const selected = c.id === selectedId;
        const dimmed = selectedId !== null && !related.has(c.id);
        return (
          <g
            key={c.id}
            className="mm-node"
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={`${c.name}, ${c.itemIds.length} elementos`}
            style={{ opacity: dimmed ? 0.45 : 1 }}
            onClick={() => onSelect(c.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(c.id);
              }
            }}
          >
            <rect
              className={selected ? "mm-pill selected" : "mm-pill"}
              x={nd.x - nd.w / 2} y={nd.y - nd.h / 2} width={nd.w} height={nd.h} rx={4}
            />
            <text className="mm-label" x={nd.x} y={nd.y} textAnchor="middle" fontSize={nd.fs}>
              {nd.lines.map((line, i) => (
                <tspan key={i} x={nd.x} dy={i === 0 ? `${-(nd.lines.length - 1) * 0.6 + 0.35}em` : "1.2em"}>{line}</tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
