"use client";

import { useState } from "react";
import { SOURCE_LABEL, displayHost } from "@/lib/source";
import type { Item } from "@/lib/types";

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(ts);

/** Tarjeta que se muestra con lo que haya: sin miniatura, sin texto o incluso sin título. */
export default function ItemCard({ item }: { item: Item }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const title = item.title || item.text || displayHost(item.url) || "Sin título";
  const body = item.title && item.text && item.text !== item.title ? item.text : "";
  const Tag = item.url ? "a" : "div";
  return (
    <Tag
      className="card item-card"
      {...(item.url ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {item.thumbnail && !thumbFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="item-thumb" src={item.thumbnail} alt="" loading="lazy" onError={() => setThumbFailed(true)} />
      )}
      <p className="meta">
        {SOURCE_LABEL[item.source]} · {formatDate(item.savedAt)}
      </p>
      <h3 className="item-title">{title}</h3>
      {body && <p className="item-body">{body}</p>}
      {item.analysis && item.analysis.topics.length > 0 && (
        <p className="meta item-topics">{item.analysis.topics.slice(0, 3).join(" · ")}</p>
      )}
    </Tag>
  );
}
