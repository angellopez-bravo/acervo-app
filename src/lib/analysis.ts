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

/** Analiza los elementos indicados y guarda el análisis. Devuelve cuántos se analizaron. */
export async function analyzeItems(items: Item[]): Promise<number> {
  let done = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const { results } = await post<{ results: { id: string; analysis: Analysis }[] }>("/api/analyze", {
      items: batch.map(({ id, url, title, text, source }) => ({ id, url, title, text, source })),
    });
    const byId = new Map(results.map((r) => [r.id, r.analysis]));
    const updated = batch.flatMap((item) => {
      const analysis = byId.get(item.id);
      return analysis ? [{ ...item, analysis }] : [];
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
