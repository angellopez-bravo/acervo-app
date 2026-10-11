import { getAllIdeas, getAllItems, putItems, putProfile, replaceIdeas } from "./db";
import { refreshItems } from "./useItems";
import { refreshIdeas } from "./useIdeas";
import { refreshProfile } from "./useProfile";
import type { Analysis, Idea, Item, Profile } from "./types";

const BATCH = 10;

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No hay conexión con el servidor.");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new AccessError(data.error);
  if (!res.ok) throw new Error(data.error ?? "No se pudo completar la solicitud.");
  return data as T;
}

/** El servidor exige el código de acceso: hay que pedirlo y reintentar. */
export class AccessError extends Error {
  constructor(message = "Hace falta el código de acceso.") {
    super(message);
  }
}

export async function login(code: string): Promise<void> {
  await post("/api/login", { code });
}

const PREVIEW_SOURCES = new Set(["tiktok", "x", "youtube"]);

type PreviewResponse = {
  preview: { title: string; text: string; author: string; thumbnail?: string } | null;
};

/**
 * Pide título, autor y miniatura a las plataformas que los ofrecen y guarda el resultado.
 * Si la consulta falla por red o servidor, el elemento queda sin marcar para reintentarlo más tarde.
 */
export async function enrichItem(item: Item): Promise<Item> {
  if (item.previewAt || !item.url || item.id.startsWith("ejemplo-") || !PREVIEW_SOURCES.has(item.source)) return item;
  let data: PreviewResponse;
  try {
    const res = await fetch(`/api/preview?url=${encodeURIComponent(item.url)}`);
    if (!res.ok) return item;
    data = await res.json();
  } catch {
    return item;
  }
  const p = data.preview;
  const enriched: Item = {
    ...item,
    // Lo que envían las apps al compartir suele ser una frase genérica; la vista previa la sustituye.
    title: p?.title || item.title,
    text: p?.title ? p.text : item.text,
    author: p?.author || item.author,
    thumbnail: item.thumbnail ?? p?.thumbnail,
    previewAt: Date.now(),
  };
  await putItems([enriched]);
  await refreshItems();
  return enriched;
}

/** Completa lo guardado antes de que existiera la vista previa. Los elementos nuevos se reanalizan si hay sesión. */
export async function catchUpPreviews(): Promise<void> {
  const pending = (await getAllItems()).filter((i) => !i.previewAt && i.url && !i.id.startsWith("ejemplo-") && PREVIEW_SOURCES.has(i.source));
  for (let i = 0; i < pending.length; i += 3) {
    const results = await Promise.all(pending.slice(i, i + 3).map(enrichItem));
    const changed = results.filter((r, n) => r.previewAt && r.analysis && r.title !== pending[i + n].title);
    if (changed.length) await analyzeItems(changed).catch(() => {});
  }
}

/** Analiza los elementos indicados y guarda el análisis. Devuelve cuántos se analizaron. */
export async function analyzeItems(items: Item[]): Promise<number> {
  let done = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const { results } = await post<{ results: { id: string; analysis: Analysis }[] }>("/api/analyze", {
      items: batch.map(({ id, url, title, text, source, author }) => ({ id, url, title, text, source, author })),
    });
    const byId = new Map(results.map((r) => [r.id, r.analysis]));
    // Se parte de la versión guardada ahora mismo, por si otro proceso enriqueció el elemento entretanto.
    const current = new Map((await getAllItems()).map((i) => [i.id, i]));
    const updated = batch.flatMap((item) => {
      const analysis = byId.get(item.id);
      return analysis ? [{ ...(current.get(item.id) ?? item), analysis }] : [];
    });
    await putItems(updated);
    await refreshItems();
    done += updated.length;
  }
  return done;
}

export async function analyzePending(): Promise<number> {
  const pending = (await getAllItems()).filter((i) => !i.analysis);
  return pending.length ? analyzeItems(pending) : 0;
}

type ProfileResponse = {
  clusters: Profile["clusters"];
  highlights: Profile["highlights"];
  ideas: Pick<Idea, "kind" | "title" | "why" | "clusterIds">[];
};

/** Analiza lo pendiente, pide el perfil y las ideas, y lo guarda todo en local. */
export async function generateProfile(): Promise<Profile> {
  await catchUpPreviews();
  await analyzePending();
  const analyzed = (await getAllItems()).filter((i) => i.analysis);
  const result = await post<ProfileResponse>("/api/profile", {
    items: analyzed.map(({ id, url, title, text, savedAt, analysis }) => ({ id, url, title, text, savedAt, analysis })),
  });

  const profile: Profile = { clusters: result.clusters, highlights: result.highlights, generatedAt: Date.now() };
  await putProfile(profile);

  // Lo que decidiste sobre una idea se conserva, y las que marcaste como interesantes no se pierden.
  const old = await getAllIdeas();
  const previous = new Map(old.map((i) => [i.title.toLowerCase(), i]));
  const fresh: Idea[] = result.ideas.map((idea, order) => ({
    ...idea,
    order,
    id: previous.get(idea.title.toLowerCase())?.id ?? crypto.randomUUID(),
    status: previous.get(idea.title.toLowerCase())?.status ?? "nueva",
  }));
  const titles = new Set(fresh.map((i) => i.title.toLowerCase()));
  const kept = old
    .filter((i) => i.status === "interesa" && !titles.has(i.title.toLowerCase()))
    .map((i, n) => ({ ...i, order: fresh.length + n }));
  await replaceIdeas([...fresh, ...kept]);
  await refreshIdeas();
  await refreshProfile();
  return profile;
}
