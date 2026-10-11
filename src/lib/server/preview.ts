import { ApiError, clip } from "./claude";
import { detectSource } from "../source";

export type Preview = {
  title: string;
  text: string;
  author: string;
  /** Imagen incrustada (data URL): las miniaturas de TikTok caducan, así que se guardan dentro de la app. */
  thumbnail?: string;
};

const UA = "Mozilla/5.0 (compatible; Acervo/1.0)";
const TIMEOUT_MS = 8000;
const MAX_THUMB_BYTES = 600_000;
const TIKTOK_SHORT = /^(vm|vt)\.tiktok\.com$/;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

const isTikTokHost = (host: string) => host === "tiktok.com" || host.endsWith(".tiktok.com");

async function fetchJson(endpoint: string): Promise<Record<string, unknown> | null> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError("No se pudo consultar la vista previa.", 502);
  }
  // 4xx: el contenido es privado, no existe o no tiene vista previa. Es una respuesta definitiva.
  if (res.status >= 400 && res.status < 500) return null;
  if (!res.ok) throw new ApiError("No se pudo consultar la vista previa.", 502);
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—" };

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Extrae el texto del tuit del HTML incrustado que devuelve oEmbed. */
function tweetText(html: string): string {
  const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
  return decodeEntities(paragraph.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
    .replace(/\s*pic\.(twitter|x)\.com\/\S+/g, "")
    .trim();
}

async function fetchThumbnail(raw: string): Promise<string | undefined> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  // Solo imágenes servidas por la CDN de TikTok: nunca una dirección arbitraria.
  if (url.protocol !== "https:" || !/(tiktok|muscdn|byteimg)/i.test(url.hostname)) return undefined;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return undefined;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_THUMB_BYTES) return undefined;
    return `data:${type.split(";")[0]};base64,${bytes.toString("base64")}`;
  } catch {
    return undefined;
  }
}

async function tiktokPreview(url: string): Promise<Preview | null> {
  let target = url;
  if (TIKTOK_SHORT.test(hostOf(url))) {
    // Los enlaces cortos redirigen al vídeo; se sigue la redirección y se vuelve a comprobar el dominio.
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
      target = res.url;
    } catch {
      throw new ApiError("No se pudo resolver el enlace corto.", 502);
    }
    if (!isTikTokHost(hostOf(target))) return null;
  }
  const clean = target.split("?")[0];
  const data = await fetchJson(`https://www.tiktok.com/oembed?url=${encodeURIComponent(clean)}`);
  if (!data) return null;
  return {
    title: clip(data.title, 500).trim(),
    text: "",
    author: clip(data.author_name, 100).trim(),
    thumbnail: typeof data.thumbnail_url === "string" ? await fetchThumbnail(data.thumbnail_url) : undefined,
  };
}

async function xPreview(url: string): Promise<Preview | null> {
  const data = await fetchJson(`https://publish.x.com/oembed?omit_script=1&url=${encodeURIComponent(url.split("?")[0])}`);
  if (!data) return null;
  const text = tweetText(clip(data.html, 20_000));
  return { title: text.slice(0, 280), text: "", author: clip(data.author_name, 100).trim() };
}

async function youtubePreview(url: string): Promise<Preview | null> {
  const data = await fetchJson(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  if (!data) return null;
  // La miniatura de YouTube se deduce del identificador en el cliente.
  return { title: clip(data.title, 500).trim(), text: "", author: clip(data.author_name, 100).trim() };
}

/**
 * Consulta los servicios oEmbed oficiales de cada plataforma.
 * Instagram no ofrece datos públicos sin iniciar sesión, así que no se intenta.
 * Devuelve null cuando no hay vista previa disponible.
 */
export async function getPreview(url: string): Promise<Preview | null> {
  switch (detectSource(url)) {
    case "tiktok":
      return tiktokPreview(url);
    case "x":
      return xPreview(url);
    case "youtube":
      return youtubePreview(url);
    default:
      return null;
  }
}
