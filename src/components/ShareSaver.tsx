"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { analyzeItems } from "@/lib/analysis";
import { findItemByUrl, putItem } from "@/lib/db";
import { detectSource, extractUrl, youtubeThumbnail } from "@/lib/source";
import { refreshItems } from "@/lib/useItems";
import type { Item } from "@/lib/types";

type Status = "guardando" | "guardado" | "repetido" | "error";

const HEADING = {
  guardando: "Guardando",
  guardado: "Guardado",
  repetido: "Ya estaba guardado",
  vacio: "Nada que guardar",
  error: "No se pudo guardar",
};
const DETAIL = {
  guardado: "El elemento ya forma parte de tu acervo.",
  repetido: "Este enlace ya está en tu acervo.",
  vacio: "El contenido compartido no incluía ni enlace ni texto.",
  error: "El almacenamiento local no está disponible. Inténtalo de nuevo.",
};

export default function ShareSaver() {
  const params = useSearchParams();
  const title = (params.get("title") ?? "").trim();
  const text = (params.get("text") ?? "").trim();
  // Muchas apps envían el enlace dentro de `text` en lugar de `url`.
  const link = params.get("url") || extractUrl(text, title);
  const body = link ? text.replace(link, "").trim() : text;
  const empty = !link && !title && !body;

  const [status, setStatus] = useState<Status>("guardando");
  const started = useRef(false);

  useEffect(() => {
    if (empty || started.current) return;
    started.current = true;

    (async (): Promise<Status> => {
      if (link && (await findItemByUrl(link))) return "repetido";
      const item: Item = {
        id: crypto.randomUUID(),
        url: link,
        title,
        text: body,
        source: detectSource(link),
        savedAt: Date.now(),
        thumbnail: youtubeThumbnail(link),
      };
      await putItem(item);
      await refreshItems();
      // El análisis es secundario: si falla o no hay conexión, queda pendiente para después.
      analyzeItems([item]).catch(() => {});
      return "guardado";
    })().then(setStatus, () => setStatus("error"));
  }, [empty, link, title, body]);

  const shown = empty ? "vacio" : status;

  return (
    <div className="saved" role="status">
      <div>
        <p className="label">Compartir</p>
        <h1 className="page-title" style={{ marginTop: 8 }}>{HEADING[shown]}</h1>
        {shown !== "guardando" && <p className="page-lead">{DETAIL[shown]}</p>}
      </div>
      {shown !== "guardando" && (
        <div>
          <Link href="/biblioteca" className="btn btn-primary">Ver en la biblioteca</Link>
        </div>
      )}
    </div>
  );
}
