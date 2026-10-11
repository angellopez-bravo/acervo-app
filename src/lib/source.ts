import type { SourceApp } from "./types";

export const SOURCE_LABEL: Record<SourceApp, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  otro: "Otro",
};

export function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

export function detectSource(raw: string): SourceApp {
  const host = parseUrl(raw)?.hostname.replace(/^(www|m|mobile|vm|vt)\./, "") ?? "";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host === "x.com" || host === "t.co" || host.endsWith("twitter.com")) return "x";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "youtube";
  return "otro";
}

export function extractUrl(...candidates: string[]): string {
  for (const c of candidates) {
    const match = c.match(/https?:\/\/[^\s]+/);
    if (match) return match[0];
  }
  return "";
}

export function youtubeThumbnail(raw: string): string | undefined {
  const u = parseUrl(raw);
  if (!u) return undefined;
  let id: string | null = null;
  if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  else if (u.hostname.endsWith("youtube.com")) {
    id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1] ?? null;
  }
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
}

export function displayHost(raw: string): string {
  return parseUrl(raw)?.hostname.replace(/^www\./, "") ?? "";
}
